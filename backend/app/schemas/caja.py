from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TipoMovimiento(str, Enum):
    INGRESO = "INGRESO"
    EGRESO = "EGRESO"

class MovimientoCajaBase(BaseModel):
    tipo: TipoMovimiento
    concepto: str
    monto: float
    categoria: Optional[str] = None

class MovimientoCajaCreate(MovimientoCajaBase):
    pass

class MovimientoCajaResponse(MovimientoCajaBase):
    id: int
    fecha: datetime
    usuario_id: Optional[int] = None

    class Config:
        from_attributes = True

class CajaSummary(BaseModel):
    saldo_actual: float
    total_ingresos: float
    total_egresos: float
