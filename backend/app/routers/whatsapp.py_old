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
    clean_number = msg.from_number.split("@")[0]
    cliente = db.query(Cliente).filter(
        Cliente.telefono_whatsapp.contains(clean_number)
    ).first()

    if not cliente:
        print(f"Message from unknown number: {clean_number}")
        return {"status": "ignored", "reason": "unknown_client"}

    # 2. Parse Order with AI
    parsed = await parse_whatsapp_order(msg.body)
    
    if not parsed.get("items"):
        return {"status": "ignored", "reason": "no_items_detected"}

    # 3. Create Draft Pedido
    new_pedido = Pedido(
        cliente_id=cliente.id,
        estado="Pendiente de Validación",
        observaciones=f"WhatsApp: '{msg.body}'",
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
    # This would call the whatsapp-bot service
    return {"status": "connected"} # Placeholder
