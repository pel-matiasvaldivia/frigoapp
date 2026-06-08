from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.schemas.producto import ProductoCreate, ProductoUpdate, ProductoResponse

router = APIRouter(prefix="/productos", tags=["Productos"])

admin_or_staff = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO", "VENDEDOR", "REPARTIDOR"])
write_access = RoleChecker(["SUPERADMIN", "ADMINISTRATIVO"])

@router.get("/", response_model=List[ProductoResponse])
def list_productos(
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(admin_or_staff)
):
    """
    Get all active products in catalog.
    """
    return db.query(Producto).all()

@router.get("/{producto_id}", response_model=ProductoResponse)
def get_producto(
    producto_id: int, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(admin_or_staff)
):
    """
    Get details of a single product.
    """
    prod = db.query(Producto).filter(Producto.id == producto_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return prod

@router.post("/", response_model=ProductoResponse)
def create_producto(
    producto_in: ProductoCreate, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(write_access)
):
    """
    Add a new product to the catalog.
    """
    existing_code = db.query(Producto).filter(Producto.codigo == producto_in.codigo).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="El código del producto ya existe")
        
    new_prod = Producto(
        codigo=producto_in.codigo,
        descripcion=producto_in.descripcion,
        departamento=producto_in.departamento,
        activo=producto_in.activo
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)
    return new_prod

@router.put("/{producto_id}", response_model=ProductoResponse)
def update_producto(
    producto_id: int, 
    producto_in: ProductoUpdate, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(write_access)
):
    """
    Modify an existing product properties.
    """
    prod = db.query(Producto).filter(Producto.id == producto_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    for field, value in producto_in.model_dump(exclude_unset=True).items():
        setattr(prod, field, value)
        
    db.commit()
    db.refresh(prod)
    return prod

@router.delete("/{producto_id}")
def delete_producto(
    producto_id: int, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(write_access)
):
    """
    Deletes a product from the database catalog.
    """
    prod = db.query(Producto).filter(Producto.id == producto_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(prod)
    db.commit()
    return {"detail": "Producto eliminado exitosamente"}
