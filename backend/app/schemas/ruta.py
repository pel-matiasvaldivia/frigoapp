from pydantic import BaseModel
from typing import Optional
from app.schemas.usuario import UsuarioResponse

class RutaBase(BaseModel):
    nombre: str
    zona: Optional[str] = None
    dias_reparto: Optional[str] = None # e.g. "Lunes,Miércoles,Viernes"
    repartidor_id: Optional[int] = None

class RutaCreate(RutaBase):
    pass

class RutaUpdate(BaseModel):
    nombre: Optional[str] = None
    zona: Optional[str] = None
    dias_reparto: Optional[str] = None
    repartidor_id: Optional[int] = None

class RutaResponse(RutaBase):
    id: int
    repartidor: Optional[UsuarioResponse] = None

    class Config:
        from_attributes = True
