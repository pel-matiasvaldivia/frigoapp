from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(String, nullable=False)  # SUPERADMIN, ADMINISTRATIVO, VENDEDOR, REPARTIDOR, CLIENTE, EMPLEADO
    pin = Column(String, nullable=True)  # Numeric PIN for attendance clocking
    valor_hora = Column(Integer, default=0)  # Hourly rate for payroll calculation
    activo = Column(Boolean, default=True)

    # Relationships
    clientes = relationship("Cliente", back_populates="usuario")
