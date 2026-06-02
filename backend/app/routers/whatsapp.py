import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.cliente import Cliente
from app.models.cuenta_corriente import CuentaCorriente
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
    # Try exact match by WhatsApp ID (JID/LID) first - This is 100% accurate
    registrado = db.query(Cliente).filter(Cliente.whatsapp_id == msg.from_number).first()
    
    if not registrado:
        # Fallback 1: Phone number matching
        clean_number = "".join(filter(str.isdigit, msg.from_number))
        clientes = db.query(Cliente).filter(Cliente.telefono_whatsapp != None).all()

        for c in clientes:
            c_digits = "".join(filter(str.isdigit, c.telefono_whatsapp))
            if not c_digits: continue
            
            if len(clean_number) >= 8:
                if clean_number.endswith(c_digits) or c_digits.endswith(clean_number):
                    registrado = c
                    break
            elif clean_number == c_digits:
                registrado = c
                break

    if not registrado:
        # Fallback 2: Smarter name matching (intersection of words)
        if msg.sender and msg.sender.get("name"):
            push_name_words = set(msg.sender["name"].lower().split())
            all_clientes = db.query(Cliente).all()
            
            best_match = None
            max_intersection = 0
            
            for c in all_clientes:
                c_words = set(c.razon_social.lower().split())
                intersection = len(push_name_words.intersection(c_words))
                if intersection > max_intersection:
                    max_intersection = intersection
                    best_match = c
            
            if max_intersection >= 2: # Require at least 2 words matching for auto-link safety
                registrado = best_match
                print(f"Cliente identificado por coincidencia de palabras ({max_intersection}): {registrado.razon_social}")

    if not registrado:
        # Fallback 3: Create or use a 'WhatsApp Desconocido' client so it shows in dashboard
        # Try to find a client named 'DESCONOCIDO'
        desconocido = db.query(Cliente).filter(Cliente.razon_social.ilike("%DESCONOCIDO%")).first()
        if not desconocido:
            # Create one if it doesn't exist
            desconocido = Cliente(
                razon_social=f"DESCONOCIDO ({msg.sender.get('name') or 'S/N'})",
                telefono_whatsapp=msg.from_number,
                direccion="Sin dirección",
                activo=True
            )
            db.add(desconocido)
            db.flush()
            # Init account
            cc = CuentaCorriente(cliente_id=desconocido.id, saldo_actual=0.0)
            db.add(cc)
            db.commit()
            db.refresh(desconocido)
            
        registrado = desconocido
        print(f"Mensaje de remitente NO identificado ({msg.from_number}). Usando Cliente Desconocido.")

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
