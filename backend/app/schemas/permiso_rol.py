from pydantic import BaseModel
from typing import List

class PermisoRolBase(BaseModel):
    rol: str
    modulo: str
    habilitado: bool

class PermisoRolResponse(PermisoRolBase):
    id: int

    class Config:
        from_attributes = True

class PermisoRolUpdate(BaseModel):
    habilitado: bool
