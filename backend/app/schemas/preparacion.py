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
    tracking_uuid: Optional[str] = None
    estado_logistico: Optional[str] = "PREPARADO"
    fecha_carga: Optional[datetime] = None
    fecha_entrega: Optional[datetime] = None

    class Config:
        from_attributes = True

class ComprobanteBasic(BaseModel):
    id: int
    tipo: str
    numero: str
    pdf_path: Optional[str] = None
    estado: str

    class Config:
        from_attributes = True

class ClienteBasic(BaseModel):
    id: int
    razon_social: str
    direccion: str

    class Config:
        from_attributes = True

class PedidoBasicInfo(BaseModel):
    id: int
    cliente_id: int
    estado: str
    total: float
    comprobantes: List[ComprobanteBasic] = []
    cliente: Optional[ClienteBasic] = None

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
    pedido: Optional[PedidoBasicInfo] = None
    
    class Config:
        from_attributes = True
