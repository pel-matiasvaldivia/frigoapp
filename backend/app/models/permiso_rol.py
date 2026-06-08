from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base

class PermisoRol(Base):
    __tablename__ = "permiso_rol"

    id = Column(Integer, primary_key=True, index=True)
    rol = Column(String, nullable=False) # SUPERADMIN, ADMINISTRATIVO, VENDEDOR, REPARTIDOR
    modulo = Column(String, nullable=False) # e.g. "CAJA", "PEDIDOS", "CONFIGURACION"
    habilitado = Column(Boolean, default=False)
