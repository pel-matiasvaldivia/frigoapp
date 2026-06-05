from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.caja import MovimientoCaja, TipoMovimiento, SesionCaja, ConceptoCaja, EstadoSesion
from app.models.usuario import Usuario
from app.schemas.caja import (
    MovimientoCajaCreate, MovimientoCajaResponse, CajaSummary,
    SesionCajaCreate, SesionCajaCierre, SesionCajaResponse,
    ConceptoCajaCreate, ConceptoCajaUpdate, ConceptoCajaResponse
)

router = APIRouter(prefix="/caja", tags=["Caja"])

admin_access = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO"])


# ─── CONCEPTOS ────────────────────────────────────────────────────────────────

@router.get("/conceptos", response_model=List[ConceptoCajaResponse])
def list_conceptos(db: Session = Depends(get_db), current_user: Usuario = Depends(admin_access)):
    return db.query(ConceptoCaja).order_by(ConceptoCaja.codigo).all()


@router.post("/conceptos", response_model=ConceptoCajaResponse)
def create_concepto(
    data: ConceptoCajaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_access)
):
    existing = db.query(ConceptoCaja).filter(ConceptoCaja.codigo == data.codigo).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"El código {data.codigo} ya está en uso.")
    concepto = ConceptoCaja(**data.model_dump())
    db.add(concepto)
    db.commit()
    db.refresh(concepto)
    return concepto


@router.put("/conceptos/{concepto_id}", response_model=ConceptoCajaResponse)
def update_concepto(
    concepto_id: int,
    data: ConceptoCajaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_access)
):
    concepto = db.query(ConceptoCaja).filter(ConceptoCaja.id == concepto_id).first()
    if not concepto:
        raise HTTPException(status_code=404, detail="Concepto no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(concepto, field, value)
    db.commit()
    db.refresh(concepto)
    return concepto


@router.delete("/conceptos/{concepto_id}")
def delete_concepto(
    concepto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_access)
):
    concepto = db.query(ConceptoCaja).filter(ConceptoCaja.id == concepto_id).first()
    if not concepto:
        raise HTTPException(status_code=404, detail="Concepto no encontrado")
    db.delete(concepto)
    db.commit()
    return {"detail": "Concepto eliminado"}


# ─── SESIONES ─────────────────────────────────────────────────────────────────

@router.get("/sesion/activa", response_model=Optional[SesionCajaResponse])
def get_sesion_activa(db: Session = Depends(get_db), current_user: Usuario = Depends(admin_access)):
    sesion = db.query(SesionCaja).filter(SesionCaja.estado == EstadoSesion.ABIERTA).first()
    return sesion


@router.post("/sesion/abrir", response_model=SesionCajaResponse)
def abrir_sesion(
    data: SesionCajaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_access)
):
    existing = db.query(SesionCaja).filter(SesionCaja.estado == EstadoSesion.ABIERTA).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una sesión de caja abierta.")
    sesion = SesionCaja(
        monto_apertura=data.monto_apertura,
        observaciones=data.observaciones,
        usuario_id=current_user.id
    )
    db.add(sesion)
    db.commit()
    db.refresh(sesion)
    return sesion


@router.post("/sesion/{sesion_id}/cerrar", response_model=SesionCajaResponse)
def cerrar_sesion(
    sesion_id: int,
    data: SesionCajaCierre,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_access)
):
    sesion = db.query(SesionCaja).filter(SesionCaja.id == sesion_id, SesionCaja.estado == EstadoSesion.ABIERTA).first()
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión activa no encontrada.")
    sesion.estado = EstadoSesion.CERRADA
    sesion.fecha_cierre = datetime.utcnow()
    sesion.monto_cierre = data.monto_cierre
    if data.observaciones:
        sesion.observaciones = (sesion.observaciones or "") + f" | Cierre: {data.observaciones}"
    db.commit()
    db.refresh(sesion)
    return sesion


@router.get("/sesion/{sesion_id}/movimientos", response_model=List[MovimientoCajaResponse])
def get_movimientos_sesion(
    sesion_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_access)
):
    return db.query(MovimientoCaja).filter(
        MovimientoCaja.sesion_id == sesion_id
    ).order_by(MovimientoCaja.fecha.desc()).all()


# ─── MOVIMIENTOS ──────────────────────────────────────────────────────────────

@router.get("/summary", response_model=CajaSummary)
def get_caja_summary(db: Session = Depends(get_db), current_user: Usuario = Depends(admin_access)):
    sesion = db.query(SesionCaja).filter(SesionCaja.estado == EstadoSesion.ABIERTA).first()

    if sesion:
        # Summary scoped to the active session
        ingresos = db.query(func.sum(MovimientoCaja.monto)).filter(
            MovimientoCaja.tipo == TipoMovimiento.INGRESO,
            MovimientoCaja.sesion_id == sesion.id
        ).scalar() or 0.0
        egresos = db.query(func.sum(MovimientoCaja.monto)).filter(
            MovimientoCaja.tipo == TipoMovimiento.EGRESO,
            MovimientoCaja.sesion_id == sesion.id
        ).scalar() or 0.0
    else:
        ingresos = db.query(func.sum(MovimientoCaja.monto)).filter(MovimientoCaja.tipo == TipoMovimiento.INGRESO).scalar() or 0.0
        egresos = db.query(func.sum(MovimientoCaja.monto)).filter(MovimientoCaja.tipo == TipoMovimiento.EGRESO).scalar() or 0.0

    return {
        "saldo_actual": (sesion.monto_apertura if sesion else 0.0) + ingresos - egresos,
        "total_ingresos": ingresos,
        "total_egresos": egresos,
        "sesion_activa": sesion
    }


@router.get("/", response_model=List[MovimientoCajaResponse])
def list_movimientos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_access),
    tipo: Optional[TipoMovimiento] = None,
    sesion_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 200
):
    query = db.query(MovimientoCaja)
    if tipo:
        query = query.filter(MovimientoCaja.tipo == tipo)
    if sesion_id:
        query = query.filter(MovimientoCaja.sesion_id == sesion_id)
    return query.order_by(MovimientoCaja.fecha.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=MovimientoCajaResponse)
def create_movimiento(
    movimiento_in: MovimientoCajaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_access)
):
    # If no sesion_id provided, auto-link to active session
    sesion_id = movimiento_in.sesion_id
    if not sesion_id:
        sesion = db.query(SesionCaja).filter(SesionCaja.estado == EstadoSesion.ABIERTA).first()
        if sesion:
            sesion_id = sesion.id

    # If concepto_id provided, auto-fill concepto name
    concepto_texto = movimiento_in.concepto
    if movimiento_in.concepto_id:
        concepto_obj = db.query(ConceptoCaja).filter(ConceptoCaja.id == movimiento_in.concepto_id).first()
        if concepto_obj:
            concepto_texto = f"[{concepto_obj.codigo}] {concepto_obj.nombre}"

    new_mov = MovimientoCaja(
        tipo=movimiento_in.tipo,
        concepto=concepto_texto,
        monto=movimiento_in.monto,
        categoria=movimiento_in.categoria,
        sesion_id=sesion_id,
        concepto_id=movimiento_in.concepto_id,
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
