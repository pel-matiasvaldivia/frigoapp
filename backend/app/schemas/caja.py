from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TipoMovimiento(str, Enum):
    INGRESO = "INGRESO"
    EGRESO = "EGRESO"


class EstadoSesion(str, Enum):
    ABIERTA = "ABIERTA"
    CERRADA = "CERRADA"


# --- Conceptos ---

class ConceptoCajaBase(BaseModel):
    codigo: int
    nombre: str
    tipo: TipoMovimiento
    activo: bool = True


class ConceptoCajaCreate(ConceptoCajaBase):
    pass


class ConceptoCajaUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[TipoMovimiento] = None
    activo: Optional[bool] = None


class ConceptoCajaResponse(ConceptoCajaBase):
    id: int

    class Config:
        from_attributes = True


# --- Sesiones ---

class SesionCajaCreate(BaseModel):
    monto_apertura: float
    observaciones: Optional[str] = None


class SesionCajaCierre(BaseModel):
    monto_cierre: float
    observaciones: Optional[str] = None


class SesionCajaResponse(BaseModel):
    id: int
    fecha_apertura: datetime
    fecha_cierre: Optional[datetime] = None
    monto_apertura: float
    monto_cierre: Optional[float] = None
    estado: EstadoSesion
    observaciones: Optional[str] = None
    usuario_id: Optional[int] = None

    class Config:
        from_attributes = True


# --- Movimientos ---

class MovimientoCajaBase(BaseModel):
    tipo: TipoMovimiento
    concepto: str
    monto: float
    categoria: Optional[str] = None
    concepto_id: Optional[int] = None


class MovimientoCajaCreate(MovimientoCajaBase):
    sesion_id: Optional[int] = None


class MovimientoCajaResponse(MovimientoCajaBase):
    id: int
    fecha: datetime
    sesion_id: Optional[int] = None
    usuario_id: Optional[int] = None
    concepto_ref: Optional[ConceptoCajaResponse] = None

    class Config:
        from_attributes = True


class CajaSummary(BaseModel):
    saldo_actual: float
    total_ingresos: float
    total_egresos: float
    sesion_activa: Optional[SesionCajaResponse] = None
