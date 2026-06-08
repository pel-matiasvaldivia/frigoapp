from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
import uuid

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.preparacion import OrdenPreparacion, OrdenPreparacionBulto
from app.models.pedido import Pedido, PedidoItem
from app.models.producto import Producto
from app.models.listas_precios import ListaPreciosDetalle
from app.models.usuario import Usuario
from app.models.comprobante import Comprobante
from app.models.configuracion import ConfiguracionSistema
from app.core.celery_app import generar_pdf_comprobante_task, enviar_notificacion_factura_task
from app.utils.label_generator import generate_labels_pdf
from app.schemas.preparacion import OrdenPreparacionResponse, OrdenPreparacionUpdate

router = APIRouter(prefix="/preparacion", tags=["Preparación de Bultos"])

prep_staff = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO", "REPARTIDOR"]) # Repartidores and staff can view, admins can write.
write_access = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO", "REPARTIDOR"])

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
    When marked as 'Completado', transitions the parent order state and 
    AUTOMATICALLY generates a Remito (Delivery Note).
    """
    prep = db.query(OrdenPreparacion).filter(OrdenPreparacion.id == orden_id).first()
    if not prep:
        raise HTTPException(status_code=404, detail="Orden de preparación no encontrada")
        
    pedido = db.query(Pedido).filter(Pedido.id == prep.pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido asociado no encontrado")

    # 1. Update preparation state
    old_state = prep.estado
    if payload.estado:
        prep.estado = payload.estado
        if payload.estado == "En preparación":
            pedido.estado = "En preparación"
        elif payload.estado == "Completado":
            pedido.estado = "Listo para despacho"
            
    if payload.observaciones is not None:
        prep.observaciones = payload.observaciones
        
    # 2. Sync Bultos & PedidoItems
    if payload.bultos is not None:
        payload_bulto_ids = [b.id for b in payload.bultos if b.id is not None]
        
        # Delete bultos not in payload
        for bulto_db in prep.bultos[:]:
            if bulto_db.id not in payload_bulto_ids:
                # Delete corresponding PedidoItem
                db.query(PedidoItem).filter(
                    PedidoItem.pedido_id == pedido.id,
                    PedidoItem.producto_id == bulto_db.producto_id
                ).delete()
                db.delete(bulto_db)
                
        # Update or add bultos
        for bulto_in in payload.bultos:
            if bulto_in.id:
                # Update existing
                bulto_db = db.query(OrdenPreparacionBulto).filter(
                    OrdenPreparacionBulto.id == bulto_in.id,
                    OrdenPreparacionBulto.orden_id == orden_id
                ).first()
                if bulto_db:
                    bulto_db.unidades = bulto_in.unidades
                    bulto_db.peso_estimado_kg = bulto_in.peso_estimado_kg
                    bulto_db.peso_real_kg = bulto_in.peso_real_kg
                    bulto_db.confirmado = bulto_in.confirmado
                    
                    if bulto_in.confirmado and not bulto_db.tracking_uuid:
                        bulto_db.tracking_uuid = f"TRK-{uuid.uuid4().hex[:8].upper()}"
                    
                    # Sync with PedidoItem
                    item_db = next((it for it in pedido.items if it.producto_id == bulto_db.producto_id), None)
                    if item_db:
                        item_db.cantidad_unidades = bulto_in.unidades
                        item_db.peso_estimado_kg = bulto_in.peso_estimado_kg
                        item_db.peso_real_kg = bulto_in.peso_real_kg
                        # Update subtotal
                        ref_weight = bulto_in.peso_real_kg if bulto_in.confirmado else bulto_in.peso_estimado_kg
                        item_db.subtotal = round(item_db.precio_unitario * ref_weight, 2)
            else:
                # Add new item
                # 1. Resolve price
                det = db.query(ListaPreciosDetalle).filter(
                    ListaPreciosDetalle.lista_precios_id == pedido.cliente.lista_precios_id,
                    ListaPreciosDetalle.producto_id == bulto_in.producto_id
                ).first()
                precio_unit = det.precio_venta if det else 0.0
                
                # 2. Add PedidoItem
                ref_weight = bulto_in.peso_real_kg if bulto_in.confirmado else bulto_in.peso_estimado_kg
                new_item = PedidoItem(
                    pedido_id=pedido.id,
                    producto_id=bulto_in.producto_id,
                    cantidad_unidades=bulto_in.unidades,
                    peso_estimado_kg=bulto_in.peso_estimado_kg,
                    peso_real_kg=bulto_in.peso_real_kg,
                    precio_unitario=precio_unit,
                    subtotal=round(precio_unit * ref_weight, 2)
                )
                db.add(new_item)
                
                # 3. Add OrdenPreparacionBulto
                new_bulto = OrdenPreparacionBulto(
                    orden_id=prep.id,
                    producto_id=bulto_in.producto_id,
                    unidades=bulto_in.unidades,
                    peso_estimado_kg=bulto_in.peso_estimado_kg,
                    peso_real_kg=bulto_in.peso_real_kg,
                    confirmado=bulto_in.confirmado
                )
                if bulto_in.confirmado:
                    new_bulto.tracking_uuid = f"TRK-{uuid.uuid4().hex[:8].upper()}"
                db.add(new_bulto)
            
    # 3. Finalize
    if prep.estado == "Completado":
        pedido.total = round(sum(it.subtotal for it in pedido.items), 2)

    db.commit()
    db.refresh(prep)
    db.refresh(pedido)
    return prep

@router.get("/{orden_id}/labels")
def get_order_labels(
    orden_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    orden = db.query(OrdenPreparacion).filter(OrdenPreparacion.id == orden_id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
        
    # Only allow if completed
    if orden.estado != "Completado":
        raise HTTPException(status_code=400, detail="La orden debe estar completada para generar etiquetas")
        
    pdf_path = generate_labels_pdf(db, orden, orden.bultos)
    return {"pdf_path": pdf_path}

@router.get("/bulto/{tracking_uuid}")
def get_bulto_by_tracking(
    tracking_uuid: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    bulto = db.query(OrdenPreparacionBulto).filter(OrdenPreparacionBulto.tracking_uuid == tracking_uuid).first()
    if not bulto:
        raise HTTPException(status_code=404, detail="Bulto no encontrado")
    return {
        "id": bulto.id,
        "producto": bulto.producto.descripcion,
        "peso": bulto.peso_real_kg,
        "estado_logistico": bulto.estado_logistico,
        "cliente": bulto.orden.pedido.cliente.razon_social
    }

@router.post("/scan/{tracking_uuid}")
def scan_bulto(
    tracking_uuid: str,
    action: str, # "CARGA", "ENTREGA"
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    bulto = db.query(OrdenPreparacionBulto).filter(OrdenPreparacionBulto.tracking_uuid == tracking_uuid).first()
    if not bulto:
        raise HTTPException(status_code=404, detail="Bulto no encontrado")
    
    if action == "CARGA":
        bulto.estado_logistico = "CARGADO"
        bulto.fecha_carga = datetime.datetime.utcnow()
        # Update parent Pedido status to "En reparto"
        if bulto.orden.pedido.estado == "Listo para despacho":
            bulto.orden.pedido.estado = "En reparto"
            
    elif action == "ENTREGA":
        bulto.estado_logistico = "ENTREGADO"
        bulto.fecha_entrega = datetime.datetime.utcnow()
        # Check if all bultos are entregados
        all_done = all(b.estado_logistico == "ENTREGADO" for b in bulto.orden.bultos)
        if all_done:
            bulto.orden.pedido.estado = "Entregado"
    else:
        raise HTTPException(status_code=400, detail="Acción no válida")
    
    db.commit()
    return {
        "status": "ok", 
        "new_state": bulto.estado_logistico,
        "pedido_id": bulto.orden.pedido.id,
        "pedido_estado": bulto.orden.pedido.estado
    }
