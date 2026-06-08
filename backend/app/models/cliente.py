from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    razon_social = Column(String, nullable=False, index=True)
    cuit = Column(String, nullable=True, unique=True, index=True)
    codigo = Column(String, nullable=True, unique=True, index=True)
    whatsapp_id = Column(String, nullable=True, unique=True, index=True)
    direccion = Column(String, nullable=False)
    telefono_whatsapp = Column(String, nullable=True)
    ruta_id = Column(Integer, ForeignKey("rutas.id"), nullable=True)
    lista_precios_id = Column(Integer, ForeignKey("listas_precios.id"), nullable=True)
    limite_credito = Column(Float, default=0.0)
    latitud = Column(Float, nullable=True)
    longitud = Column(Float, nullable=True)
    activo = Column(Boolean, default=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Relationships
    usuario = relationship("Usuario", back_populates="clientes")
    ruta = relationship("Ruta", back_populates="clientes")
    lista_precios = relationship("ListaPrecios", back_populates="clientes")
    cuenta_corriente = relationship("CuentaCorriente", back_populates="cliente", uselist=False, cascade="all, delete-orphan")
    pedidos = relationship("Pedido", back_populates="cliente")
