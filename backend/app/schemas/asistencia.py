from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class AsistenciaBase(BaseModel):
    usuario_id: int
    entrada: datetime
    salida: Optional[datetime] = None
    horas: float = 0.0

class AsistenciaCreate(BaseModel):
    pin: str
    tipo: str = "ENTRADA"  # ENTRADA or SALIDA

class AsistenciaResponse(AsistenciaBase):
    id: int
    usuario_nombre: Optional[str] = None

    class Config:
        from_attributes = True

class AsistenciaReporte(BaseModel):
    usuario_id: int
    usuario_nombre: str
    total_horas: float
    valor_hora: float
    total_a_pagar: float
    registros: List[AsistenciaResponse]
