from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
import datetime
import enum


class TipoMovimiento(str, enum.Enum):
    INGRESO = "INGRESO"
    EGRESO = "EGRESO"


class EstadoSesion(str, enum.Enum):
    ABIERTA = "ABIERTA"
    CERRADA = "CERRADA"


class SesionCaja(Base):
    __tablename__ = "sesiones_caja"

    id = Column(Integer, primary_key=True, index=True)
    fecha_apertura = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    fecha_cierre = Column(DateTime, nullable=True)
    monto_apertura = Column(Float, nullable=False, default=0.0)
    monto_cierre = Column(Float, nullable=True)
    estado = Column(Enum(EstadoSesion), default=EstadoSesion.ABIERTA, nullable=False)
    observaciones = Column(String, nullable=True)

    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    usuario = relationship("Usuario")
    movimientos = relationship("MovimientoCaja", back_populates="sesion", order_by="MovimientoCaja.fecha")


class ConceptoCaja(Base):
    __tablename__ = "conceptos_caja"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(Integer, unique=True, nullable=False, index=True)
    nombre = Column(String, nullable=False)
    tipo = Column(Enum(TipoMovimiento), nullable=False)
    activo = Column(Boolean, default=True, nullable=False)


class MovimientoCaja(Base):
    __tablename__ = "movimientos_caja"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    tipo = Column(Enum(TipoMovimiento), nullable=False)
    concepto = Column(String, nullable=False)
    monto = Column(Float, nullable=False)
    categoria = Column(String, nullable=True)

    sesion_id = Column(Integer, ForeignKey("sesiones_caja.id"), nullable=True)
    sesion = relationship("SesionCaja", back_populates="movimientos")

    concepto_id = Column(Integer, ForeignKey("conceptos_caja.id"), nullable=True)
    concepto_ref = relationship("ConceptoCaja")

    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    usuario = relationship("Usuario")

    class Config:
        from_attributes = True
