from sqlalchemy import Column, Integer, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base

class Asistencia(Base):
    __tablename__ = "asistencias"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    entrada = Column(DateTime, default=datetime.utcnow, nullable=False)
    salida = Column(DateTime, nullable=True)
    horas = Column(Float, default=0.0)

    # Relationship
    usuario = relationship("Usuario")
