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

from app.models.configuracion import ConfiguracionSistema

@router.post("/fichar", response_model=AsistenciaResponse)
def fichar(
    asistencia_in: AsistenciaCreate,
    db: Session = Depends(get_db)
):
    """
    Clock in (ENTRADA) or out (SALIDA) using a PIN.
    """
    user = db.query(Usuario).filter(Usuario.pin == asistencia_in.pin, Usuario.activo == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="PIN incorrecto o usuario inactivo")
    
    now = datetime.utcnow()
    tipo = asistencia_in.tipo.upper()

    # Get shift config
    config_entrada = db.query(ConfiguracionSistema).filter(ConfiguracionSistema.clave == "HORARIO_ENTRADA").first()
    config_salida = db.query(ConfiguracionSistema).filter(ConfiguracionSistema.clave == "HORARIO_SALIDA").first()
    
    hora_entrada_limit = config_entrada.valor if config_entrada else "08:00"
    hora_salida_limit = config_salida.valor if config_salida else "17:00"

    if tipo == "ENTRADA":
        open_session = db.query(Asistencia).filter(
            Asistencia.usuario_id == user.id,
            Asistencia.salida == None
        ).first()
        if open_session:
            raise HTTPException(
                status_code=400,
                detail=f"{user.nombre} ya tiene un ingreso registrado sin egreso."
            )
        
        # Calculate tardiness (minutes)
        tardanza_mins = 0
        try:
            h_in, m_in = map(int, hora_entrada_limit.split(':'))
            # Convert 'now' to local time if needed? Assuming UTC for now as per project convention
            # But shift times are usually local. Let's compare time components only.
            # Convert now to the same day's shift start
            shift_start = now.replace(hour=h_in, minute=m_in, second=0, microsecond=0)
            if now > shift_start:
                tardanza_seconds = (now - shift_start).total_seconds()
                tardanza_mins = int(tardanza_seconds / 60)
        except:
            pass

        new_asistencia = Asistencia(usuario_id=user.id, entrada=now, tardanza=tardanza_mins)
        db.add(new_asistencia)
        db.commit()
        db.refresh(new_asistencia)
        res = new_asistencia
    elif tipo == "SALIDA":
        open_session = db.query(Asistencia).filter(
            Asistencia.usuario_id == user.id,
            Asistencia.salida == None
        ).first()
        if not open_session:
            raise HTTPException(status_code=400, detail=f"{user.nombre} no tiene un ingreso activo.")
        
        open_session.salida = now
        delta = open_session.salida - open_session.entrada
        
        # 15-minute rounding (0.25h steps)
        total_seconds = delta.total_seconds()
        # Round to nearest 900 seconds (15 mins)
        rounded_seconds = round(total_seconds / 900) * 900
        open_session.horas = round(rounded_seconds / 3600, 2)

        # Calculate overtime
        hs_extra = 0.0
        try:
            h_out, m_out = map(int, hora_salida_limit.split(':'))
            shift_end = now.replace(hour=h_out, minute=m_out, second=0, microsecond=0)
            if now > shift_end:
                extra_seconds = (now - shift_end).total_seconds()
                hs_extra = round(max(0, extra_seconds / 3600), 2)
        except:
            pass
        
        open_session.horas_extra = hs_extra
        db.commit()
        db.refresh(open_session)
        res = open_session
    else:
        raise HTTPException(status_code=400, detail="Tipo debe ser ENTRADA o SALIDA")
    
    return {
        "id": res.id,
        "usuario_id": res.usuario_id,
        "entrada": res.entrada,
        "salida": res.salida,
        "horas": res.horas,
        "tardanza": res.tardanza,
        "horas_extra": res.horas_extra,
        "usuario_nombre": user.nombre
    }

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
                "total_tardanza": 0,
                "total_horas_extra": 0.0,
                "valor_hora": u.valor_hora,
                "total_a_pagar": 0.0,
                "registros": []
            }
        
        reporte_map[uid]["total_horas"] += r.horas
        reporte_map[uid]["total_tardanza"] += r.tardanza
        reporte_map[uid]["total_horas_extra"] += r.horas_extra
        reporte_map[uid]["registros"].append({
            "id": r.id,
            "usuario_id": r.usuario_id,
            "entrada": r.entrada,
            "salida": r.salida,
            "horas": r.horas,
            "tardanza": r.tardanza,
            "horas_extra": r.horas_extra,
            "usuario_nombre": u.nombre
        })
    
    # Finalize calculations
    final_reporte = []
    for uid, data in reporte_map.items():
        data["total_a_pagar"] = round(data["total_horas"] * data["valor_hora"], 2)
        final_reporte.append(data)
        
    return final_reporte
