from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.cuenta_corriente import CuentaCorriente, MovimientoCC
from app.models.cliente import Cliente
from app.models.usuario import Usuario
from app.schemas.cuenta_corriente import CuentaCorrienteResponse, RegistrarPagoRequest, MovimientoCCResponse

router = APIRouter(prefix="/cuentas-corrientes", tags=["Cuentas Corrientes"])

admin_staff = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO"])
read_access = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO", "CLIENTE"])

@router.get("/", response_model=List[dict])
def list_cuentas_corrientes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_staff)
):
    """
    Get all clients' credit balances and credit limits.
    """
    cc_list = db.query(CuentaCorriente).all()
    result = []
    for cc in cc_list:
        result.append({
            "id": cc.id,
            "cliente_id": cc.cliente_id,
            "cliente_razon_social": cc.cliente.razon_social,
            "cuit": cc.cliente.cuit,
            "saldo_actual": cc.saldo_actual,
            "limite_credito": cc.limite_credito,
            "fecha_actualizacion": cc.fecha_actualizacion,
            "supera_limite": cc.saldo_actual > cc.limite_credito
        })
    return result

@router.get("/cliente/{cliente_id}", response_model=CuentaCorrienteResponse)
def get_cuenta_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(read_access)
):
    """
    Fetch movements and balance of a specific client's account.
    Clients can only fetch their own accounts.
    """
    if current_user.rol == "CLIENTE":
        cliente = db.query(Cliente).filter(Cliente.usuario_id == current_user.id).first()
        if not cliente or cliente.id != cliente_id:
            raise HTTPException(status_code=403, detail="No autorizado para ver esta cuenta corriente")
            
    cc = db.query(CuentaCorriente).filter(CuentaCorriente.cliente_id == cliente_id).first()
    if not cc:
        raise HTTPException(status_code=404, detail="Cuenta corriente no encontrada")
        
    return cc

@router.post("/cliente/{cliente_id}/pagar", response_model=MovimientoCCResponse)
def registrar_pago(
    cliente_id: int,
    payload: RegistrarPagoRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(admin_staff)
):
    """
    Post a payment (CREDITO) to a client's account, reducing their debt/balance.
    """
    cc = db.query(CuentaCorriente).filter(CuentaCorriente.cliente_id == cliente_id).first()
    if not cc:
        raise HTTPException(status_code=404, detail="Cuenta corriente no encontrada")
        
    # Apply payment: CREDIT decreases balance (debt)
    cc.saldo_actual = round(cc.saldo_actual - payload.monto, 2)
    cc.fecha_actualizacion = datetime.datetime.utcnow()
    
    ref = payload.referencia or "S/R"
    desc = payload.descripcion or f"Pago recibido - {payload.tipo_pago}"
    
    mov = MovimientoCC(
        cuenta_id=cc.id,
        tipo="CREDITO",
        monto=payload.monto,
        referencia=ref,
        fecha=datetime.datetime.utcnow(),
        descripcion=desc
    )
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov
