from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
import datetime
import enum

class TipoMovimiento(str, enum.Enum):
    INGRESO = "INGRESO"
    EGRESO = "EGRESO"

class MovimientoCaja(Base):
    __tablename__ = "movimientos_caja"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    tipo = Column(Enum(TipoMovimiento), nullable=False)
    concepto = Column(String, nullable=False) # e.g. "Pago flete", "Venta contado", etc.
    monto = Column(Float, nullable=False)
    categoria = Column(String, nullable=True) # e.g. "Gastos Administrativos", "Logística", etc.
    
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    usuario = relationship("Usuario")

    class Config:
        from_attributes = True
