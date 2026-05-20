from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base

class Ruta(Base):
    __tablename__ = "rutas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False, index=True)
    zona = Column(String, nullable=True)
    dias_reparto = Column(String, nullable=True) # e.g. "Lunes,Miércoles,Viernes" or JSON
    repartidor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Relationships
    repartidor = relationship("Usuario")
    clientes = relationship("Cliente", back_populates="ruta")
    ordenes_preparacion = relationship("OrdenPreparacion", back_populates="ruta")
