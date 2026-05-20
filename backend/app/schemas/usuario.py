from pydantic import BaseModel, EmailStr
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    rol: str # SUPERADMIN, ADMINISTRATIVO, VENDEDOR, REPARTIDOR, CLIENTE
    activo: Optional[bool] = True

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None

class UsuarioResponse(UsuarioBase):
    id: int

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
