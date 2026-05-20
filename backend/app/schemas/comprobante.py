from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ComprobanteCreate(BaseModel):
    pedido_id: int
    tipo: str # "FACTURA" o "REMITO"

class ComprobanteResponse(BaseModel):
    id: int
    pedido_id: int
    tipo: str
    numero: str
    fecha: datetime
    total: float
    pdf_path: Optional[str] = None
    estado: str
    firma_repartidor_path: Optional[str] = None

    class Config:
        from_attributes = True

class RepartidorEntregaRequest(BaseModel):
    estado_pedido: str # "Entregado", "Entrega parcial", "No entregado"
    observaciones: Optional[str] = None
    firma_base64: Optional[str] = None # canvas raw base64 data to save as png
