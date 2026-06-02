from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker, get_password_hash
from app.models.cliente import Cliente
from app.models.usuario import Usuario
from app.models.cuenta_corriente import CuentaCorriente
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse

router = APIRouter(prefix="/clientes", tags=["Clientes"])

# Allowed roles: SUPERADMIN and ADMINISTRATIVO can do CRUD. VENDEDOR can read.
admin_or_staff = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO", "VENDEDOR"])
write_access = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO"])

@router.get("/", response_model=List[ClienteResponse])
def list_clientes(
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(admin_or_staff)
):
    """
    Get all clients. Admins and Salesmen can list clients.
    """
    # If vendedor, we could filter by assigned clients, but for simplicity we list all.
    return db.query(Cliente).all()

@router.get("/template")
def get_clientes_template(current_user: Usuario = Depends(write_access)):
    """
    Returns a CSV template for bulk client import.
    """
    import csv
    import io
    from fastapi.responses import StreamingResponse

    output = io.StringIO()
    writer = csv.writer(output, delimiter=';')
    writer.writerow([
        "razon_social", "cuit", "direccion", "telefono_whatsapp", 
        "ruta_id", "lista_precios_id", "limite_credito"
    ])
    # Add a sample row
    writer.writerow([
        "Cliente Ejemplo S.A.", "30712345678", "Av. Principal 123", "54911223344", 
        "1", "1", "50000"
    ])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8-sig')), 
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=plantilla_clientes.csv"}
    )

@router.post("/import")
async def import_clientes(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(write_access)
):
    """
    Bulk import clients from a semicolon-delimited CSV file.
    """
    import csv
    import io

    content = await file.read()
    try:
        # Handle BOM if present (utf-8-sig)
        decoded = content.decode('utf-8-sig')
    except Exception:
        decoded = content.decode('latin-1')

    reader = csv.DictReader(io.StringIO(decoded), delimiter=';')
    
    # Try to detect if the delimiter is different (if first row has no known headers)
    first_row = next(reader, None)
    if first_row and len(first_row) == 1 and ',' in list(first_row.keys())[0]:
        # Likely comma delimited
        reader = csv.DictReader(io.StringIO(decoded), delimiter=',')
    else:
        # Reset reader if first row was okay or just use semicolon
        reader = csv.DictReader(io.StringIO(decoded), delimiter=';')

    imported_count = 0
    errors = []
    
    for i, row in enumerate(reader):
        try:
            # Helper to get value from multiple possible keys (aliases)
            def get_val(prefixes):
                for p in prefixes:
                    for k in row.keys():
                        if k and p.lower() in k.lower():
                            return row[k]
                return None

            # Support aliases: Razón Social / Nombre / Cliente
            razon_social = (get_val(["razon_social", "nombre", "cliente"]) or "").strip()
            
            if not razon_social:
                # If the row is completely empty, just skip it
                if not any(row.values()):
                    continue
                errors.append(f"Fila {i+1}: Razón Social/Nombre es requerida")
                continue
                
            cuit = (get_val(["cuit"]) or "").strip() or None
            if cuit:
                existing = db.query(Cliente).filter(Cliente.cuit == cuit).first()
                if existing:
                    errors.append(f"Fila {i+1}: CUIT {cuit} ya existe")
                    continue
            
            # Support aliases: Teléfono / Celular / WhatsApp / Numero
            telefono = (get_val(["telefono", "celular", "whatsapp", "numero"]) or "").strip()
            # Support aliases: Dirección / Calle / Domicilio
            direccion = (get_val(["direccion", "domicilio", "calle", "address"]) or "Sin dirección").strip()

            # Convert numeric fields
            def get_num(prefixes, default=None):
                val = get_val(prefixes)
                if val and str(val).strip().isdigit():
                    return int(str(val).strip())
                return default

            ruta_id = get_num(["ruta_id", "ruta"], None)
            lista_id = get_num(["lista_precios_id", "lista"], None)
            
            limite_val = get_val(["limite_credito", "credito", "limite"])
            limite = float(limite_val) if limite_val and str(limite_val).replace('.','',1).isdigit() else 0.0
            
            new_cliente = Cliente(
                razon_social=razon_social,
                cuit=cuit,
                direccion=direccion,
                telefono_whatsapp=telefono,
                ruta_id=ruta_id,
                lista_precios_id=lista_id,
                limite_credito=limite,
                activo=True
            )
            db.add(new_cliente)
            db.flush() # To get ID
            
            # Initialize Cuenta Corriente
            cc = CuentaCorriente(
                cliente_id=new_cliente.id,
                saldo_actual=0.0,
                limite_credito=limite
            )
            db.add(cc)
            imported_count += 1
            
        except Exception as e:
            errors.append(f"Fila {i+1}: Error: {str(e)}")

    db.commit()
    return {
        "success": True, 
        "imported": imported_count, 
        "errors": errors
    }

@router.get("/{cliente_id}", response_model=ClienteResponse)
def get_cliente(
    cliente_id: int, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(admin_or_staff)
):
    """
    Retrieve specific client by ID.
    """
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

@router.post("/", response_model=ClienteResponse)
def create_cliente(
    cliente_in: ClienteCreate, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(write_access)
):
    """
    Create a new client. Initializes their accounts.
    If 'crear_usuario' is enabled, creates a Client user portal account.
    """
    # Check if CUIT already exists
    if cliente_in.cuit:
        existing_cuit = db.query(Cliente).filter(Cliente.cuit == cliente_in.cuit).first()
        if existing_cuit:
            raise HTTPException(status_code=400, detail="El CUIT ya está registrado")
            
    usuario_id = None
    if cliente_in.crear_usuario and cliente_in.email and cliente_in.password:
        # Check if email exists
        existing_email = db.query(Usuario).filter(Usuario.email == cliente_in.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="El email del usuario ya está registrado")
            
        new_user = Usuario(
            nombre=cliente_in.razon_social,
            email=cliente_in.email,
            password_hash=get_password_hash(cliente_in.password),
            rol="CLIENTE",
            activo=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        usuario_id = new_user.id

    new_cliente = Cliente(
        razon_social=cliente_in.razon_social,
        cuit=cliente_in.cuit,
        direccion=cliente_in.direccion,
        telefono_whatsapp=cliente_in.telefono_whatsapp,
        ruta_id=cliente_in.ruta_id,
        lista_precios_id=cliente_in.lista_precios_id,
        limite_credito=cliente_in.limite_credito,
        activo=cliente_in.activo,
        usuario_id=usuario_id if usuario_id else cliente_in.usuario_id
    )
    db.add(new_cliente)
    db.commit()
    db.refresh(new_cliente)
    
    # Initialize Cuenta Corriente account
    cc = CuentaCorriente(
        cliente_id=new_cliente.id,
        saldo_actual=0.0,
        limite_credito=new_cliente.limite_credito or 0.0
    )
    db.add(cc)
    db.commit()
    
    # Re-retrieve to populate relations
    return db.query(Cliente).filter(Cliente.id == new_cliente.id).first()

@router.put("/{cliente_id}", response_model=ClienteResponse)
def update_cliente(
    cliente_id: int, 
    cliente_in: ClienteUpdate, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(write_access)
):
    """
    Update a client details. Updates credit limits on accounts.
    """
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    # Update fields
    for field, value in cliente_in.model_dump(exclude_unset=True).items():
        setattr(cliente, field, value)
        
    db.commit()
    
    # Keep Credit limit synced with Cuenta Corriente
    if cliente.cuenta_corriente and cliente_in.limite_credito is not None:
        cliente.cuenta_corriente.limite_credito = cliente_in.limite_credito
        db.commit()
        
    db.refresh(cliente)
    return cliente

@router.delete("/{cliente_id}")
def delete_cliente(
    cliente_id: int, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(write_access)
):
    """
    Delete a client. Cleans related records.
    """
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    # If the client has a linked user account, delete it too
    if cliente.usuario_id:
        user = db.query(Usuario).filter(Usuario.id == cliente.usuario_id).first()
        if user:
            db.delete(user)
            
    db.delete(cliente)
    db.commit()
    return {"detail": "Cliente eliminado exitosamente"}

