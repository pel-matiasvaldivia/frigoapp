from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.producto import ProductoResponse

class ListaPreciosBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    activa: Optional[bool] = True

class ListaPreciosCreate(ListaPreciosBase):
    pass

class ListaPreciosUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activa: Optional[bool] = None

class ListaPreciosResponse(ListaPreciosBase):
    id: int
    fecha_actualizacion: datetime

    class Config:
        from_attributes = True

class ListaPreciosDetalleBase(BaseModel):
    lista_precios_id: int
    producto_id: int
    precio_costo: float
    precio_venta: float
    precio_mayoreo: float
    stock: float
    stock_minimo: float

class ListaPreciosDetalleCreate(ListaPreciosDetalleBase):
    pass

class ListaPreciosDetalleUpdate(BaseModel):
    precio_costo: Optional[float] = None
    precio_venta: Optional[float] = None
    precio_mayoreo: Optional[float] = None
    stock: Optional[float] = None
    stock_minimo: Optional[float] = None

class ListaPreciosDetalleResponse(ListaPreciosDetalleBase):
    id: int
    producto: Optional[ProductoResponse] = None

    class Config:
        from_attributes = True

class ListaPreciosConDetalles(ListaPreciosResponse):
    detalles: List[ListaPreciosDetalleResponse] = []

    class Config:
        from_attributes = True

class BulkPriceUpdate(BaseModel):
    lista_id: int
    tipo_ajuste: str # "porcentaje" o "fijo"
    valor: float # e.g. 10 para aumentar 10% o 500 para aumentar $500
    departamento: Optional[str] = None # opcional, filtrar por departamento
