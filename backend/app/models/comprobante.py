from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base

class Comprobante(Base):
    __tablename__ = "comprobantes"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    tipo = Column(String, nullable=False)  # "FACTURA", "REMITO"
    numero = Column(String, unique=True, index=True, nullable=False)
    fecha = Column(DateTime, default=func.now(), index=True)
    total = Column(Float, default=0.0)
    pdf_path = Column(String, nullable=True)
    estado = Column(String, default="Emitido")  # "Emitido", "Cobrado", "Anulado"
    firma_repartidor_path = Column(String, nullable=True)

    # Relationships
    pedido = relationship("Pedido", back_populates="comprobantes")
