from pydantic import BaseModel
from typing import Optional

class ProductoBase(BaseModel):
    codigo: str
    descripcion: str
    departamento: Optional[str] = None # Cortes frescos, Elaborados, Fiambres, Especiales
    activo: Optional[bool] = True

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    codigo: Optional[str] = None
    descripcion: Optional[str] = None
    departamento: Optional[str] = None
    activo: Optional[bool] = None

class ProductoResponse(ProductoBase):
    id: int

    class Config:
        from_attributes = True
