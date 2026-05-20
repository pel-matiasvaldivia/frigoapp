from pydantic import BaseModel
from typing import Optional

class ConfiguracionSistemaBase(BaseModel):
    clave: str
    valor: str
    modulo: Optional[str] = None
    descripcion: Optional[str] = None

class ConfiguracionSistemaUpdate(BaseModel):
    valor: str

class ConfiguracionSistemaResponse(ConfiguracionSistemaBase):
    id: int

    class Config:
        from_attributes = True
