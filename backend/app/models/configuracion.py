from sqlalchemy import Column, Integer, String

from app.core.database import Base

class ConfiguracionSistema(Base):
    __tablename__ = "configuracion_sistema"

    id = Column(Integer, primary_key=True, index=True)
    clave = Column(String, unique=True, index=True, nullable=False)
    valor = Column(String, nullable=False)
    modulo = Column(String, nullable=True) # e.g. "Ventas", "Cuentas Corrientes", "General"
    descripcion = Column(String, nullable=True)
