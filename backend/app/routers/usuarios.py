from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker, get_password_hash
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate, UsuarioResponse

router = APIRouter(prefix="/usuarios", tags=["Gestión de Usuarios"])

admin_only = RoleChecker(["SUPERADMIN"])

@router.get("/", response_model=List[UsuarioResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_only)
):
    """
    Lists all users. Restricted to Superadmins.
    """
    return db.query(Usuario).all()

@router.post("/", response_model=UsuarioResponse)
def create_user(
    user_in: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_only)
):
    """
    Creates a new user.
    """
    # Check if email exists
    existing = db.query(Usuario).filter(Usuario.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    new_user = Usuario(
        nombre=user_in.nombre,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        rol=user_in.rol,
        activo=user_in.activo
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=UsuarioResponse)
def update_user(
    user_id: int,
    user_in: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_only)
):
    """
    Updates an existing user.
    """
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Check email uniqueness if changing
    if user_in.email and user_in.email != user.email:
        existing = db.query(Usuario).filter(Usuario.email == user_in.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="El email ya está uso")
        user.email = user_in.email

    if user_in.nombre: user.nombre = user_in.nombre
    if user_in.rol: user.rol = user_in.rol
    if user_in.pin is not None: user.pin = user_in.pin
    if user_in.valor_hora is not None: user.valor_hora = user_in.valor_hora
    if user_in.activo is not None: user.activo = user_in.activo
    if user_in.password:
        user.password_hash = get_password_hash(user_in.password)
        
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_only)
):
    """
    Deletes a user.
    """
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Prevent self-deletion of the superadmin that is logged in
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propio usuario")

    db.delete(user)
    db.commit()
    return {"status": "success", "message": "Usuario eliminado correctamente"}
