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
read_access = Depends(get_current_user)

@router.get("/", response_model=List[ConfiguracionSistemaResponse])
def list_configuraciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(superadmin_only)
):
    """
    Get all system configurations (Superadmin only).
    """
    return db.query(ConfiguracionSistema).all()

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

@router.get("/empresa")
def get_empresa_details(
    current_user: Usuario = read_access
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
