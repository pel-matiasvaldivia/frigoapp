import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.cliente import Cliente
from app.models.pedido import Pedido, PedidoItem
from app.models.producto import Producto
from app.models.listas_precios import ListaPreciosDetalle
from app.services.ai_order import parse_whatsapp_order
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any
from app.core.security import get_current_user
from app.models.usuario import Usuario

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])

class WhatsAppMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    from_number: str = Field(..., alias="from")
    body: str = ""
    sender: Optional[Any] = None
    timestamp: Optional[Any] = None

@router.post("/webhook")
async def whatsapp_webhook(msg: WhatsAppMessage, db: Session = Depends(get_db)):
    # 1. Identify Client
    clean_number = "".join(filter(str.isdigit, msg.from_number))
    
    # Strictly search for the number/LID in the database
    # We match if the incoming number (clean) matches exactly or if one is contained in the other
    # but ONLY if it's a long enough sequence to avoid collision
    clientes = db.query(Cliente).filter(Cliente.telefono_whatsapp != None).all()

    registrado = None
    for c in clientes:
        c_digits = "".join(filter(str.isdigit, c.telefono_whatsapp))
        if not c_digits: continue
        
        # If incoming number is a real phone number
        if len(clean_number) >= 8:
            if clean_number.endswith(c_digits) or c_digits.endswith(clean_number):
                registrado = c
                break
        # If it's a LID or shorter ID, we need exact match
        elif clean_number == c_digits:
            registrado = c
            break

    if not registrado:
        # Fallback 2: Try to match by Name (ONLY if exact match or very close to avoid errors)
        if msg.sender and msg.sender.get("name"):
            push_name = msg.sender["name"].strip()
            # Try exact match first
            registrado = db.query(Cliente).filter(Cliente.razon_social.ilike(push_name)).first()
            if registrado:
                print(f"Cliente identificado por nombre exacto: {registrado.razon_social}")
            else:
                # Try to see if pushName is part of razon_social and it's long enough
                if len(push_name) > 5:
                    registrado = db.query(Cliente).filter(Cliente.razon_social.ilike(f"%{push_name}%")).first()
                    if registrado:
                        print(f"Cliente identificado por coincidencia de nombre: {registrado.razon_social}")

    if not registrado:
        print(f"Mensaje de remitente desconocido: {msg.from_number} ({msg.sender.get('name') if msg.sender else 'SN'})")
        return {"status": "ignored", "reason": "unknown_sender"}

    if not registrado:
        print(f"ERROR: No se pudo identificar al cliente para el mensaje: {msg.from_number}")
        return {"status": "ignored", "reason": "unknown_sender"}

    cliente = registrado

    # 2. Parse Order with AI
    parsed = await parse_whatsapp_order(msg.body)
    print(f"AI Parsed Result: {parsed}")
    
    if not parsed.get("items"):
        print(f"No items detected in message: {msg.body}")
        return {"status": "ignored", "reason": "no_items_detected"}

    # 3. Create Draft Pedido
    obs_prefix = f"WhatsApp ({msg.from_number})"
    new_pedido = Pedido(
        cliente_id=cliente.id,
        estado="Pendiente de Validación",
        observaciones=f"{obs_prefix}: '{msg.body}'",
        total=0.0
    )
    db.add(new_pedido)
    db.flush()

    # 4. Try to match items
    for item in parsed["items"]:
        producto = db.query(Producto).filter(
            Producto.descripcion.ilike(f"%{item['producto']}%")
        ).first()
        
        if producto:
            # Get price from client's list
            price_detail = db.query(ListaPreciosDetalle).filter(
                ListaPreciosDetalle.lista_precios_id == cliente.lista_precios_id,
                ListaPreciosDetalle.producto_id == producto.id
            ).first()
            
            precio = price_detail.precio_venta if price_detail else 0.0
            
            # Logic for units/kg
            is_kg = item.get("unidad", "").lower() in ["kg", "kilos", "kilo"]
            
            item_obj = PedidoItem(
                pedido_id=new_pedido.id,
                producto_id=producto.id,
                cantidad_unidades=0.0 if is_kg else item["cantidad"],
                peso_estimado_kg=item["cantidad"] if is_kg else 0.0,
                precio_unitario=precio,
                subtotal=item["cantidad"] * precio
            )
            db.add(item_obj)
            new_pedido.total += item_obj.subtotal

    db.commit()
    return {"status": "success", "pedido_id": new_pedido.id}

@router.get("/status")
async def get_whatsapp_status():
    async with httpx.AsyncClient() as client:
        try:
            # Connect to the bot's internal Express API
            response = await client.get("http://whatsapp-bot:3001/status", timeout=2.0)
            return response.json()
        except Exception as e:
            # If bot is starting or unreachable
            return {"status": "loading", "qr": None}

@router.post("/logout")
async def logout_whatsapp(current_user: Usuario = Depends(get_current_user)):
    """
    Triggers a logout in the WhatsApp bot, clearing the session data.
    Only accessible by authenticated staff/admins.
    """
    if current_user.rol not in ["SUPERADMIN", "ADMINISTRATIVO"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para cerrar sesión de WhatsApp")

    async with httpx.AsyncClient() as client:
        try:
            # Connect to the bot's internal Express API
            response = await client.post("http://whatsapp-bot:3001/logout", timeout=5.0)
            return response.json()
        except Exception as e:
            print(f"[WhatsApp] Error proxying logout: {e}")
            raise HTTPException(status_code=500, detail="El servicio de WhatsApp no está disponible")
