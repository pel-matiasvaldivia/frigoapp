from pydantic import BaseModel
from typing import Optional
from app.schemas.ruta import RutaResponse
from app.schemas.listas_precios import ListaPreciosResponse

class ClienteBase(BaseModel):
    razon_social: str
    cuit: Optional[str] = None
    direccion: str
    telefono_whatsapp: Optional[str] = None
    ruta_id: Optional[int] = None
    lista_precios_id: Optional[int] = None
    limite_credito: Optional[float] = 0.0
    activo: Optional[bool] = True
    usuario_id: Optional[int] = None

class ClienteCreate(ClienteBase):
    # Optional parameters to create a user account for the customer portal PWA
    crear_usuario: Optional[bool] = False
    email: Optional[str] = None
    password: Optional[str] = None

class ClienteUpdate(BaseModel):
    razon_social: Optional[str] = None
    cuit: Optional[str] = None
    direccion: Optional[str] = None
    telefono_whatsapp: Optional[str] = None
    ruta_id: Optional[int] = None
    lista_precios_id: Optional[int] = None
    limite_credito: Optional[float] = None
    activo: Optional[bool] = None
    usuario_id: Optional[int] = None

class ClienteResponse(ClienteBase):
    id: int
    ruta: Optional[RutaResponse] = None
    lista_precios: Optional[ListaPreciosResponse] = None

    class Config:
        from_attributes = True
