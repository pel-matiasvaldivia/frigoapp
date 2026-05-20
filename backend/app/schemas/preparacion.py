from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.producto import ProductoResponse
from app.schemas.ruta import RutaResponse

class OrdenPreparacionBultoUpdate(BaseModel):
    id: int
    peso_real_kg: float
    confirmado: bool

class OrdenPreparacionUpdate(BaseModel):
    estado: Optional[str] = None # "Pendiente", "En preparación", "Completado"
    observaciones: Optional[str] = None
    bultos: List[OrdenPreparacionBultoUpdate] = []

class OrdenPreparacionBultoResponse(BaseModel):
    id: int
    orden_id: int
    producto_id: int
    unidades: float
    peso_estimado_kg: float
    peso_real_kg: float
    confirmado: bool
    producto: Optional[ProductoResponse] = None

    class Config:
        from_attributes = True

class OrdenPreparacionResponse(BaseModel):
    id: int
    pedido_id: int
    ruta_id: Optional[int] = None
    fecha_despacho: datetime
    estado: str
    observaciones: Optional[str] = None
    bultos: List[OrdenPreparacionBultoResponse] = []
    ruta: Optional[RutaResponse] = None

    class Config:
        from_attributes = True
