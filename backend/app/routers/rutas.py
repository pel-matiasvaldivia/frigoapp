from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.ruta import Ruta
from app.models.usuario import Usuario
from app.schemas.ruta import RutaCreate, RutaUpdate, RutaResponse

router = APIRouter(prefix="/rutas", tags=["Rutas de Reparto"])

admin_staff = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO"])
read_access = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO", "VENDEDOR", "REPARTIDOR"])

@router.get("/", response_model=List[RutaResponse])
def list_rutas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(read_access)
):
    """
    Get all delivery routes.
    """
    return db.query(Ruta).all()

@router.get("/{ruta_id}", response_model=RutaResponse)
def get_ruta(
    ruta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(read_access)
):
    """
    Get route detail by ID.
    """
    ruta = db.query(Ruta).filter(Ruta.id == ruta_id).first()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    return ruta

@router.post("/", response_model=RutaResponse)
def create_ruta(
    ruta_in: RutaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_staff)
):
    """
    Create a new delivery route.
    """
    new_ruta = Ruta(
        nombre=ruta_in.nombre,
        zona=ruta_in.zona,
        dias_reparto=ruta_in.dias_reparto,
        repartidor_id=ruta_in.repartidor_id
    )
    db.add(new_ruta)
    db.commit()
    db.refresh(new_ruta)
    return new_ruta

@router.put("/{ruta_id}", response_model=RutaResponse)
def update_ruta(
    ruta_id: int,
    ruta_in: RutaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_staff)
):
    """
    Modify an existing delivery route.
    """
    ruta = db.query(Ruta).filter(Ruta.id == ruta_id).first()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
        
    for field, value in ruta_in.model_dump(exclude_unset=True).items():
        setattr(ruta, field, value)
        
    db.commit()
    db.refresh(ruta)
    return ruta

@router.delete("/{ruta_id}")
def delete_ruta(
    ruta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_staff)
):
    """
    Delete a delivery route.
    """
    ruta = db.query(Ruta).filter(Ruta.id == ruta_id).first()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    db.delete(ruta)
    db.commit()
    return {"detail": "Ruta eliminada exitosamente"}
