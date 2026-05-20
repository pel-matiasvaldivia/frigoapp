from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MovimientoCCResponse(BaseModel):
    id: int
    cuenta_id: int
    tipo: str # "DEBITO" o "CREDITO"
    monto: float
    referencia: Optional[str] = None
    fecha: datetime
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True

class CuentaCorrienteResponse(BaseModel):
    id: int
    cliente_id: int
    saldo_actual: float
    limite_credito: float
    fecha_actualizacion: datetime
    movimientos: List[MovimientoCCResponse] = []

    class Config:
        from_attributes = True

class RegistrarPagoRequest(BaseModel):
    monto: float
    referencia: Optional[str] = None # e.g. "TRANSF-0918"
    tipo_pago: str # "Efectivo", "Transferencia", "Cheque"
    descripcion: Optional[str] = None
