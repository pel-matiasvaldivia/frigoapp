from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.preparacion import OrdenPreparacion, OrdenPreparacionBulto
from app.models.pedido import Pedido
from app.models.usuario import Usuario
from app.schemas.preparacion import OrdenPreparacionResponse, OrdenPreparacionUpdate

router = APIRouter(prefix="/preparacion", tags=["Preparación de Bultos"])

prep_staff = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO", "REPARTIDOR"]) # Repartidores and staff can view, admins can write.
write_access = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO"])

@router.get("/", response_model=List[OrdenPreparacionResponse])
def list_ordenes_preparacion(
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(prep_staff)
):
    """
    Get all preparation orders. Can filter by state (e.g. Pendiente, En preparación, Completado).
    """
    query = db.query(OrdenPreparacion)
    if estado:
        query = query.filter(OrdenPreparacion.estado == estado)
    return query.order_by(OrdenPreparacion.fecha_despacho.desc()).all()

@router.get("/{orden_id}", response_model=OrdenPreparacionResponse)
def get_orden_preparacion(
    orden_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(prep_staff)
):
    """
    Fetch a single preparation order by ID.
    """
    prep = db.query(OrdenPreparacion).filter(OrdenPreparacion.id == orden_id).first()
    if not prep:
        raise HTTPException(status_code=404, detail="Orden de preparación no encontrada")
    return prep

@router.put("/{orden_id}", response_model=OrdenPreparacionResponse)
def update_orden_preparacion(
    orden_id: int,
    payload: OrdenPreparacionUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(write_access)
):
    """
    Confirm weights and update status of preparation order.
    When marked as 'Completado', transitions the parent order state.
    """
    prep = db.query(OrdenPreparacion).filter(OrdenPreparacion.id == orden_id).first()
    if not prep:
        raise HTTPException(status_code=404, detail="Orden de preparación no encontrada")
        
    pedido = db.query(Pedido).filter(Pedido.id == prep.pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido asociado no encontrado")

    # 1. Update preparation state
    if payload.estado:
        prep.estado = payload.estado
        if payload.estado == "En preparación":
            pedido.estado = "En preparación"
        elif payload.estado == "Completado":
            pedido.estado = "Listo para despacho"
            
    if payload.observaciones is not None:
        prep.observaciones = payload.observaciones
        
    # 2. Update weights on items
    for bulto_in in payload.bultos:
        bulto_db = db.query(OrdenPreparacionBulto).filter(
            OrdenPreparacionBulto.id == bulto_in.id,
            OrdenPreparacionBulto.orden_id == orden_id
        ).first()
        if bulto_db:
            bulto_db.peso_real_kg = bulto_in.peso_real_kg
            bulto_db.confirmado = bulto_in.confirmado
            
            # Keep parent PedidoItem weight synced for invoice rendering
            # We lookup the matching item in Pedido
            item_db = next((it for it in pedido.items if it.producto_id == bulto_db.producto_id), None)
            if item_db:
                item_db.peso_real_kg = bulto_in.peso_real_kg
                if bulto_in.confirmado:
                    # Update item subtotal
                    item_db.subtotal = round(item_db.precio_unitario * bulto_in.peso_real_kg, 2)
            
    # Re-compute total if completed
    if prep.estado == "Completado":
        pedido.total = round(sum(it.subtotal for it in pedido.items), 2)
        
    db.commit()
    db.refresh(prep)
    db.refresh(pedido)
    return prep
