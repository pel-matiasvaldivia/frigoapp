from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.usuario import Usuario
from app.models.asistencia import Asistencia
from app.schemas.asistencia import AsistenciaCreate, AsistenciaResponse, AsistenciaReporte

router = APIRouter(prefix="/asistencia", tags=["Asistencia y Sueldos"])

admin_only = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO"])

@router.post("/fichar", response_model=AsistenciaResponse)
def fichar(
    asistencia_in: AsistenciaCreate,
    db: Session = Depends(get_db)
):
    """
    Clock in or out using a PIN.
    """
    user = db.query(Usuario).filter(Usuario.pin == asistencia_in.pin, Usuario.activo == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="PIN incorrecto o usuario inactivo")
    
    # Check for open session (entry without exit)
    open_session = db.query(Asistencia).filter(
        Asistencia.usuario_id == user.id,
        Asistencia.salida == None
    ).first()
    
    now = datetime.utcnow()
    
    if open_session:
        # Close session
        open_session.salida = now
        # Calculate hours
        delta = open_session.salida - open_session.entrada
        open_session.horas = round(delta.total_seconds() / 3600, 2)
        db.commit()
        db.refresh(open_session)
        res = open_session
    else:
        # Create new session
        new_asistencia = Asistencia(usuario_id=user.id, entrada=now)
        db.add(new_asistencia)
        db.commit()
        db.refresh(new_asistencia)
        res = new_asistencia
    
    # Add user name to response manually (or could use a joined query)
    res_dict = {
        "id": res.id,
        "usuario_id": res.usuario_id,
        "entrada": res.entrada,
        "salida": res.salida,
        "horas": res.horas,
        "usuario_nombre": user.nombre
    }
    return res_dict

@router.get("/reporte", response_model=List[AsistenciaReporte])
def get_reporte(
    desde: datetime,
    hasta: datetime,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_only)
):
    """
    Weekly/Custom range report for payroll.
    """
    # Get all attendance records in range
    registros = db.query(Asistencia).join(Usuario).filter(
        Asistencia.entrada >= desde,
        Asistencia.entrada <= hasta
    ).all()
    
    # Group by user
    reporte_map = {}
    for r in registros:
        uid = r.usuario_id
        if uid not in reporte_map:
            u = db.query(Usuario).get(uid)
            reporte_map[uid] = {
                "usuario_id": uid,
                "usuario_nombre": u.nombre,
                "total_horas": 0.0,
                "valor_hora": u.valor_hora,
                "total_a_pagar": 0.0,
                "registros": []
            }
        
        reporte_map[uid]["total_horas"] += r.horas
        reporte_map[uid]["registros"].append({
            "id": r.id,
            "usuario_id": r.usuario_id,
            "entrada": r.entrada,
            "salida": r.salida,
            "horas": r.horas,
            "usuario_nombre": u.nombre
        })
    
    # Finalize calculations
    final_reporte = []
    for uid, data in reporte_map.items():
        data["total_a_pagar"] = round(data["total_horas"] * data["valor_hora"], 2)
        final_reporte.append(data)
        
    return final_reporte
