from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.caja import MovimientoCaja, TipoMovimiento
from app.models.usuario import Usuario
from app.schemas.caja import MovimientoCajaCreate, MovimientoCajaResponse, CajaSummary

router = APIRouter(prefix="/caja", tags=["Caja"])

# Only Admins can manage Caja
admin_access = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO"])

@router.get("/summary", response_model=CajaSummary)
def get_caja_summary(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_access)
):
    """
    Get summary of current balance, total income and total expenses.
    """
    ingresos = db.query(func.sum(MovimientoCaja.monto)).filter(MovimientoCaja.tipo == TipoMovimiento.INGRESO).scalar() or 0.0
    egresos = db.query(func.sum(MovimientoCaja.monto)).filter(MovimientoCaja.tipo == TipoMovimiento.EGRESO).scalar() or 0.0
    
    return {
        "saldo_actual": ingresos - egresos,
        "total_ingresos": ingresos,
        "total_egresos": egresos
    }

@router.get("/", response_model=List[MovimientoCajaResponse])
def list_movimientos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_access),
    tipo: Optional[TipoMovimiento] = None,
    categoria: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    query = db.query(MovimientoCaja)
    if tipo:
        query = query.filter(MovimientoCaja.tipo == tipo)
    if categoria:
        query = query.filter(MovimientoCaja.categoria == categoria)
    
    return query.order_by(MovimientoCaja.fecha.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=MovimientoCajaResponse)
def create_movimiento(
    movimiento_in: MovimientoCajaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_access)
):
    new_mov = MovimientoCaja(
        **movimiento_in.model_dump(),
        usuario_id=current_user.id
    )
    db.add(new_mov)
    db.commit()
    db.refresh(new_mov)
    return new_mov

@router.delete("/{movimiento_id}")
def delete_movimiento(
    movimiento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_access)
):
    mov = db.query(MovimientoCaja).filter(MovimientoCaja.id == movimiento_id).first()
    if not mov:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    
    db.delete(mov)
    db.commit()
    return {"detail": "Movimiento eliminado"}
