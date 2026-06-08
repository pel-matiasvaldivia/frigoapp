from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.usuario import Usuario
from app.models.permiso_rol import PermisoRol
from app.schemas.permiso_rol import PermisoRolResponse, PermisoRolUpdate

router = APIRouter(prefix="/permisos", tags=["Permisos y Accesos"])

admin_only = RoleChecker(["SUPERADMIN"])

@router.get("/", response_model=List[PermisoRolResponse])
def list_permisos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_only)
):
    """
    List all permissions.
    """
    return db.query(PermisoRol).all()

@router.put("/{permiso_id}", response_model=PermisoRolResponse)
def update_permiso(
    permiso_id: int,
    permiso_in: PermisoRolUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_only)
):
    """
    Toggle a module permission for a role.
    """
    perm = db.query(PermisoRol).filter(PermisoRol.id == permiso_id).first()
    if not perm:
        raise HTTPException(status_code=404, detail="Permiso no encontrado")
    
    perm.habilitado = permiso_in.habilitado
    db.commit()
    db.refresh(perm)
    return perm

@router.get("/me", response_model=List[str])
def get_my_permissions(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Returns the list of enabled modules for the current user's role.
    Used by the frontend to hide/show UI elements.
    """
    perms = db.query(PermisoRol).filter(
        PermisoRol.rol == current_user.rol,
        PermisoRol.habilitado == True
    ).all()
    return [p.modulo for p in perms]
