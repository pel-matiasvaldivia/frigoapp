from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.pedido import Pedido
from app.models.comprobante import Comprobante
from app.models.preparacion import OrdenPreparacion
from app.models.ruta import Ruta
from app.models.usuario import Usuario
from app.models.cliente import Cliente
from app.models.producto import Producto

router = APIRouter(prefix="/dashboard", tags=["Dashboard y Reportes"])

admin_staff = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO"])

@router.get("/kpis")
def get_kpis(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_staff)
):
    """
    Get top KPIs: daily orders count, revenue, pending orders, active routes.
    """
    today_start = datetime.datetime.combine(datetime.date.today(), datetime.time.min)
    today_end = datetime.datetime.combine(datetime.date.today(), datetime.time.max)
    
    # 1. Pedidos del día
    pedidos_hoy = db.query(Pedido).filter(
        Pedido.fecha >= today_start,
        Pedido.fecha <= today_end
    ).count()
    
    # 2. Total facturado hoy (comprobantes activos emitidos hoy)
    total_facturado_hoy = db.query(func.sum(Comprobante.total)).filter(
        Comprobante.fecha >= today_start,
        Comprobante.fecha <= today_end,
        Comprobante.estado != "Anulado"
    ).scalar() or 0.0
    
    # 3. Pedidos pendientes de preparación
    pedidos_pendientes = db.query(Pedido).filter(
        Pedido.estado.in_(["Pendiente de preparación", "En preparación"])
    ).count()
    
    # 4. Rutas activas hoy (rutas with orders scheduled/active today)
    rutas_activas = db.query(Ruta).join(OrdenPreparacion).filter(
        OrdenPreparacion.fecha_despacho >= today_start,
        OrdenPreparacion.fecha_despacho <= today_end
    ).distinct().count()
    
    return {
        "pedidos_hoy": pedidos_hoy,
        "total_facturado_hoy": round(total_facturado_hoy, 2),
        "pedidos_pendientes": pedidos_pendientes,
        "rutas_activas": rutas_activas
    }

@router.get("/reporte-ventas")
def get_reporte_ventas(
    periodo: str = "mes", # "mes", "semana", "anio"
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_staff)
):
    """
    Sales breakdowns by Client, Product, Route, Driver, and Period.
    """
    # 1. Ventas por Cliente
    ventas_cliente = db.query(
        Cliente.razon_social,
        func.sum(Comprobante.total).label("total_ventas"),
        func.count(Comprobante.id).label("comprobantes_count")
    ).join(Pedido, Pedido.cliente_id == Cliente.id)\
     .join(Comprobante, Comprobante.pedido_id == Pedido.id)\
     .filter(Comprobante.estado != "Anulado")\
     .group_by(Cliente.razon_social)\
     .order_by(func.sum(Comprobante.total).desc())\
     .limit(10).all()
     
    # 2. Ventas por Ruta
    ventas_ruta = db.query(
        Ruta.nombre,
        func.sum(Comprobante.total).label("total_ventas")
    ).join(OrdenPreparacion, OrdenPreparacion.ruta_id == Ruta.id)\
     .join(Pedido, Pedido.id == OrdenPreparacion.pedido_id)\
     .join(Comprobante, Comprobante.pedido_id == Pedido.id)\
     .filter(Comprobante.estado != "Anulado")\
     .group_by(Ruta.nombre).all()
     
    # 3. Ventas por Repartidor (Driver name)
    ventas_repartidor = db.query(
        Usuario.nombre,
        func.sum(Comprobante.total).label("total_ventas"),
        func.count(Comprobante.id).label("entregas_count")
    ).select_from(Ruta)\
     .join(Usuario, Usuario.id == Ruta.repartidor_id)\
     .join(OrdenPreparacion, OrdenPreparacion.ruta_id == Ruta.id)\
     .join(Pedido, Pedido.id == OrdenPreparacion.pedido_id)\
     .join(Comprobante, Comprobante.pedido_id == Pedido.id)\
     .filter(Comprobante.estado != "Anulado")\
     .group_by(Usuario.nombre).all()

    # Formats results
    return {
        "ventas_por_cliente": [{"cliente": row[0], "total": float(row[1] or 0), "cantidad": row[2]} for row in ventas_cliente],
        "ventas_por_ruta": [{"ruta": row[0], "total": float(row[1] or 0)} for row in ventas_ruta],
        "ventas_por_repartidor": [{"repartidor": row[0], "total": float(row[1] or 0), "entregas": row[2]} for row in ventas_repartidor]
    }
