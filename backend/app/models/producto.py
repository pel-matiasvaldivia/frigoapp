from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base

class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True, nullable=False)
    descripcion = Column(String, nullable=False, index=True)
    departamento = Column(String, nullable=True) # Cortes frescos, Elaborados, Fiambres, Especiales
    activo = Column(Boolean, default=True)

    # Relationships
    detalles = relationship("ListaPreciosDetalle", back_populates="producto", cascade="all, delete-orphan")
    pedido_items = relationship("PedidoItem", back_populates="producto")
    bultos = relationship("OrdenPreparacionBulto", back_populates="producto")
