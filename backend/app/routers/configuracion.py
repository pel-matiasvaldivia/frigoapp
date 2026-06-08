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
    DESTRUCTIVE: Clear all operational data (Orders, Invoices, Cash Movements, Clients, Products).
    Superadmin only.
    """
    try:
        tables_to_truncate = [
            "movimientos_caja", "sesiones_caja", "conceptos_caja",
            "comprobantes", "pedido_items", "pedidos",
            "movimientos_cc", "cuentas_corrientes",
            "orden_preparacion_bultos", "ordenes_preparacion",
            "rutas", "lista_precios_detalle", "listas_precios",
            "clientes", "productos"
        ]
        
        # Execute TRUNCATE with CASCADE for all operational tables
        # We use raw SQL to handle CASCADE efficiently in Postgres
        truncate_sql = f"TRUNCATE {', '.join(tables_to_truncate)} RESTART IDENTITY CASCADE;"
        db.execute(text(truncate_sql))
        db.commit()
        
        # Re-apply seeds to ensure core system data (like default box concepts) exists
        seed_db()
        
        return {"status": "success", "message": "Sistema reiniciado exitosamente. Todos los datos operativos han sido eliminados."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error durante el reinicio: {str(e)}")
