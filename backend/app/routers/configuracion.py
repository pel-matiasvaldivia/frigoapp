from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.configuracion import ConfiguracionSistema
from app.models.usuario import Usuario
from app.schemas.configuracion import ConfiguracionSistemaResponse, ConfiguracionSistemaUpdate
from app.core.config import settings

router = APIRouter(prefix="/configuracion", tags=["Configuración del Sistema"])

superadmin_only = RoleChecker(["SUPERADMIN"])
all_authenticated = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO", "VENDEDOR", "REPARTIDOR", "CLIENTE"])

@router.get("/empresa")
def get_empresa_details(
    current_user: Usuario = Depends(get_current_user)
):
    """
    Get general enterprise metadata. Available to all authenticated users.
    """
    return {
        "nombre": settings.EMPRESA_NOMBRE,
        "cuit": settings.EMPRESA_CUIT,
        "direccion": settings.EMPRESA_DIRECCION,
        "telefono": settings.EMPRESA_TELEFONO,
        "email": settings.EMPRESA_EMAIL
    }

@router.get("/", response_model=List[ConfiguracionSistemaResponse])
def list_configuraciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(superadmin_only)
):
    """
    Get all system configurations (Superadmin only).
    """
    return db.query(ConfiguracionSistema).all()

from app.db.seed import seed_db
from sqlalchemy import text

@router.put("/{clave}", response_model=ConfiguracionSistemaResponse)
def update_configuracion(
    clave: str,
    payload: ConfiguracionSistemaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(superadmin_only)
):
    """
    Modify a configuration parameter (Superadmin only).
    """
    config = db.query(ConfiguracionSistema).filter(ConfiguracionSistema.clave == clave).first()
    if not config:
        raise HTTPException(status_code=404, detail="Parámetro de configuración no encontrado")
        
    config.valor = payload.valor
    db.commit()
    db.refresh(config)
    return config

@router.post("/reset-data")
def reset_system_data(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(superadmin_only)
):
    """
    DESTRUCTIVE: Clear all operational data (Orders, Invoices, Cash Movements, Clients, Products, Attendance).
    Superadmin only.
    """
    try:
        # Delete in FK-dependency order (children before parents)
        # Each table is wrapped in its own try/except so missing tables don't abort the whole reset
        ordered_deletes = [
            # Attendance
            "DELETE FROM asistencias",
            # Cash
            "DELETE FROM movimientos_caja",
            "DELETE FROM sesiones_caja",
            "DELETE FROM conceptos_caja",
            # Invoices / remitos
            "DELETE FROM comprobantes",
            # Order items and preparation
            "DELETE FROM orden_preparacion_bultos",
            "DELETE FROM ordenes_preparacion",
            "DELETE FROM pedido_items",
            "DELETE FROM pedidos",
            # Accounts receivable
            "DELETE FROM movimientos_cc",
            "DELETE FROM cuentas_corrientes",
            # Routes
            "DELETE FROM rutas",
            # Price lists
            "DELETE FROM lista_precios_detalle",
            "DELETE FROM listas_precios",
            # Core catalog
            "DELETE FROM clientes",
            "DELETE FROM productos",
        ]

        errors = []
        for stmt in ordered_deletes:
            try:
                db.execute(text(stmt))
            except Exception as tbl_err:
                errors.append(f"{stmt}: {str(tbl_err)}")
                db.rollback()

        # Reset all sequences so IDs start at 1 again
        sequence_tables = [
            "asistencias", "movimientos_caja", "sesiones_caja", "conceptos_caja",
            "comprobantes", "orden_preparacion_bultos", "ordenes_preparacion",
            "pedido_items", "pedidos", "movimientos_cc", "cuentas_corrientes",
            "rutas", "lista_precios_detalle", "listas_precios", "clientes", "productos"
        ]
        for table in sequence_tables:
            try:
                db.execute(text(f"""
                    SELECT setval(
                        pg_get_serial_sequence('{table}', 'id'), 1, false
                    )
                """))
            except Exception:
                pass

        db.commit()

        # Re-seed core system data
        try:
            seed_db()
        except Exception as seed_err:
            print(f"Aviso seed post-reset: {seed_err}")

        msg = "Sistema reiniciado exitosamente. Todos los datos operativos han sido eliminados."
        if errors:
            msg += f" Advertencias: {'; '.join(errors)}"

        return {"status": "success", "message": msg}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error durante el reinicio: {str(e)}")
