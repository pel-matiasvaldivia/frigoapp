from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash, get_current_user
from app.models.usuario import Usuario
from app.schemas.usuario import Token, UsuarioResponse, UsuarioCreate, LoginRequest

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/login", response_model=Token)
def login(request_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Standard OAuth2 Login endpoint. Returns a JWT access token.
    Uses username (email) and password.
    """
    user = db.query(Usuario).filter(Usuario.email == request_data.username).first()
    if not user or not verify_password(request_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.activo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
        
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login-json", response_model=Token)
def login_json(request_data: LoginRequest, db: Session = Depends(get_db)):
    """
    JSON Login endpoint for frontend client convenience.
    """
    user = db.query(Usuario).filter(Usuario.email == request_data.email).first()
    if not user or not verify_password(request_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    if not user.activo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
        
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UsuarioResponse)
def read_users_me(current_user: Usuario = Depends(get_current_user)):
    """
    Returns details of the currently logged-in user.
    """
    return current_user

@router.post("/register", response_model=UsuarioResponse)
def register_user(
    user_in: UsuarioCreate, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_user)
):
    """
    Register a new user. Restricted to SUPERADMIN.
    """
    if current_user.rol != "SUPERADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el Superadmin puede registrar nuevos usuarios"
        )
    # Check if exists
    existing_user = db.query(Usuario).filter(Usuario.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="El email ya está registrado"
        )
    
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
