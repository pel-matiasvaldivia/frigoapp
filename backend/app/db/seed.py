from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.usuario import Usuario
from app.models.listas_precios import ListaPrecios, ListaPreciosDetalle
from app.models.producto import Producto
from app.models.ruta import Ruta
from app.models.cliente import Cliente
from app.models.cuenta_corriente import CuentaCorriente
from app.models.configuracion import ConfiguracionSistema
import datetime

def seed_db():
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Seed default Users
        superadmin = db.query(Usuario).filter(Usuario.email == "admin@frigorificoje.com.ar").first()
        if not superadmin:
            superadmin = Usuario(
                nombre="Administrador General J&E",
                email="admin@frigorificoje.com.ar",
                password_hash=get_password_hash("admin123"),
                rol="SUPERADMIN",
                activo=True
            )
            db.add(superadmin)
            db.commit()
            db.refresh(superadmin)

        administrativo = db.query(Usuario).filter(Usuario.email == "admin_ventas@frigorificoje.com.ar").first()
        if not administrativo:
            administrativo = Usuario(
                nombre="María Gómez (Admin)",
                email="admin_ventas@frigorificoje.com.ar",
                password_hash=get_password_hash("ventas123"),
                rol="ADMINISTRATIVO",
                activo=True
            )
            db.add(administrativo)
            
        vendedor = db.query(Usuario).filter(Usuario.email == "vendedor@frigorificoje.com.ar").first()
        if not vendedor:
            vendedor = Usuario(
                nombre="Juan Pérez (Vendedor)",
                email="vendedor@frigorificoje.com.ar",
                password_hash=get_password_hash("vendedor123"),
                rol="VENDEDOR",
                activo=True
            )
            db.add(vendedor)

        repartidor = db.query(Usuario).filter(Usuario.email == "reparto@frigorificoje.com.ar").first()
        if not repartidor:
            repartidor = Usuario(
                nombre="Carlos Chofer (Repartidor)",
                email="reparto@frigorificoje.com.ar",
                password_hash=get_password_hash("reparto123"),
                rol="REPARTIDOR", # We support repartidores
                activo=True
            )
            db.add(repartidor)
            db.commit()
            db.refresh(repartidor)

        # 2. Seed Default Routes
        ruta_norte = db.query(Ruta).filter(Ruta.nombre == "Ruta Norte").first()
        if not ruta_norte:
            ruta_norte = Ruta(
                nombre="Ruta Norte",
                zona="Zona Norte GBA",
                dias_reparto="Lunes,Miércoles,Viernes",
                repartidor_id=repartidor.id
            )
            db.add(ruta_norte)
            
        ruta_sur = db.query(Ruta).filter(Ruta.nombre == "Ruta Sur").first()
        if not ruta_sur:
            ruta_sur = Ruta(
                nombre="Ruta Sur",
                zona="Zona Sur GBA",
                dias_reparto="Martes,Jueves,Sábado",
                repartidor_id=repartidor.id
            )
            db.add(ruta_sur)
            db.commit()
            db.refresh(ruta_norte)
            db.refresh(ruta_sur)

        # 3. Seed Price Lists
        # Prefijos: 1xx, 2xx, 4xx, 6xx, 7xx, 8xx
        listas_data = [
            {"id": 1, "nombre": "Lista 1 - Minorista", "descripcion": "Precios minoristas sugeridos al público"},
            {"id": 2, "nombre": "Lista 2 - Mayorista A", "descripcion": "Precios mayoristas para distribuidores medianos"},
            {"id": 4, "nombre": "Lista 4 - Mayorista B", "descripcion": "Precios mayoristas preferenciales grandes cuentas"},
            {"id": 6, "nombre": "Lista 6 - Especial", "descripcion": "Precios para clientes especiales de fábrica"},
            {"id": 7, "nombre": "Lista 7 - Feria/Mercado", "descripcion": "Precios de oferta para puestos de feria"},
            {"id": 8, "nombre": "Lista 8 - Precios Oferta", "descripcion": "Precios promocionales y liquidación de stock"}
        ]
        
        listas = {}
        for l_info in listas_data:
            lista = db.query(ListaPrecios).filter(ListaPrecios.id == l_info["id"]).first()
            if not lista:
                lista = ListaPrecios(
                    id=l_info["id"],
                    nombre=l_info["nombre"],
                    descripcion=l_info["descripcion"],
                    activa=True,
                    fecha_actualizacion=datetime.datetime.utcnow()
                )
                db.add(lista)
            listas[l_info["id"]] = lista
        db.commit()

        # 4. Seed Products
        productos_data = [
            {"codigo": "001", "descripcion": "Bondiola de Cerdo", "departamento": "Cortes frescos", "costo": 3500.0, "venta": 4500.0},
            {"codigo": "002", "descripcion": "Chorizo Colorado", "departamento": "Elaborados", "costo": 2800.0, "venta": 3800.0},
            {"codigo": "003", "descripcion": "Chorizo Especial", "departamento": "Elaborados", "costo": 2900.0, "venta": 3950.0},
            {"codigo": "004", "descripcion": "Chorizo Intermedio", "departamento": "Elaborados", "costo": 2500.0, "venta": 3400.0},
            {"codigo": "005", "descripcion": "Hamburguesas de Cerdo", "departamento": "Elaborados", "costo": 2200.0, "venta": 3100.0},
            {"codigo": "006", "descripcion": "Lomo de Cerdo", "departamento": "Cortes frescos", "costo": 3800.0, "venta": 4900.0},
            {"codigo": "007", "descripcion": "Longaniza Española", "departamento": "Fiambres", "costo": 4200.0, "venta": 5800.0},
            {"codigo": "008", "descripcion": "Matambre de Cerdo", "departamento": "Cortes frescos", "costo": 3900.0, "venta": 5100.0},
            {"codigo": "009", "descripcion": "Milanesas de Cerdo", "departamento": "Elaborados", "costo": 2400.0, "venta": 3400.0},
            {"codigo": "010", "descripcion": "Molida de Cerdo", "departamento": "Cortes frescos", "costo": 2100.0, "venta": 2900.0},
            {"codigo": "011", "descripcion": "Morcilla Criolla", "departamento": "Elaborados", "costo": 2000.0, "venta": 2800.0},
            {"codigo": "012", "descripcion": "Morcilla Valenciana", "departamento": "Elaborados", "costo": 2200.0, "venta": 3000.0},
            {"codigo": "013", "descripcion": "Panceta Salada", "departamento": "Fiambres", "costo": 3200.0, "venta": 4400.0},
            {"codigo": "014", "descripcion": "Pechito con Manta", "departamento": "Cortes frescos", "costo": 3000.0, "venta": 4200.0},
            {"codigo": "015", "descripcion": "Punta de Espalda de Cerdo", "departamento": "Cortes frescos", "costo": 3400.0, "venta": 4700.0},
            {"codigo": "016", "descripcion": "Queso de Cerdo", "departamento": "Fiambres", "costo": 2100.0, "venta": 2950.0},
            {"codigo": "017", "descripcion": "Salchicha Parrillera", "departamento": "Elaborados", "costo": 2700.0, "venta": 3700.0}
        ]

        for p_info in productos_data:
            prod = db.query(Producto).filter(Producto.codigo == p_info["codigo"]).first()
            if not prod:
                prod = Producto(
                    codigo=p_info["codigo"],
                    descripcion=p_info["descripcion"],
                    departamento=p_info["departamento"],
                    activo=True
                )
                db.add(prod)
                db.commit()
                db.refresh(prod)
            
            # Now populate details for each price list
            # We determine different prices for each list:
            # Lista 1 (Minorista): Base Venta
            # Lista 2 (Mayorista A): Base Venta * 0.90 (10% descuento)
            # Lista 4 (Mayorista B): Base Venta * 0.85 (15% descuento)
            # Lista 6 (Especial): Base Venta * 0.80 (20% descuento)
            # Lista 7 (Feria): Base Venta * 0.88 (12% descuento)
            # Lista 8 (Oferta): Base Venta * 0.75 (25% descuento)
            multipliers = {1: 1.0, 2: 0.90, 4: 0.85, 6: 0.80, 7: 0.88, 8: 0.75}
            
            for list_id, mult in multipliers.items():
                det = db.query(ListaPreciosDetalle).filter(
                    ListaPreciosDetalle.lista_precios_id == list_id,
                    ListaPreciosDetalle.producto_id == prod.id
                ).first()
                if not det:
                    precio_venta_calc = round(p_info["venta"] * mult, 2)
                    precio_mayoreo_calc = round(precio_venta_calc * 0.95, 2)
                    det = ListaPreciosDetalle(
                        lista_precios_id=list_id,
                        producto_id=prod.id,
                        precio_costo=p_info["costo"],
                        precio_venta=precio_venta_calc,
                        precio_mayoreo=precio_mayoreo_calc,
                        stock=150.0,
                        stock_minimo=30.0
                    )
                    db.add(det)
        db.commit()

        # 5. Seed a default Customer with Account
        cliente_pepe = db.query(Cliente).filter(Cliente.cuit == "20-98765432-1").first()
        if not cliente_pepe:
            # Create user for customer first
            user_pepe = Usuario(
                nombre="Carnicería Pepe",
                email="pepe@gmail.com",
                password_hash=get_password_hash("pepe123"),
                rol="CLIENTE",
                activo=True
            )
            db.add(user_pepe)
            db.commit()
            db.refresh(user_pepe)

            cliente_pepe = Cliente(
                razon_social="Carnicería Don Pepe S.H.",
                cuit="20-98765432-1",
                direccion="Av. San Martín 1500, Villa María",
                telefono_whatsapp="+5493534123456",
                ruta_id=ruta_norte.id,
                lista_precios_id=2, # Lista 2 (Mayorista A)
                limite_credito=300000.0,
                activo=True,
                usuario_id=user_pepe.id
            )
            db.add(cliente_pepe)
            db.commit()
            db.refresh(cliente_pepe)

            # Create Cuenta Corriente
            cc = CuentaCorriente(
                cliente_id=cliente_pepe.id,
                saldo_actual=0.0,
                limite_credito=300000.0
            )
            db.add(cc)
            db.commit()

        # 6. Seed Config
        configs = [
            {"clave": "DIAS_VENCIMIENTO_FACTURA", "valor": "15", "modulo": "Ventas", "descripcion": "Días hasta el vencimiento de una factura"},
            {"clave": "MONEDA_SIMBOLO", "valor": "$", "modulo": "General", "descripcion": "Símbolo de la moneda activa"},
            {"clave": "NUM_FACTURA_SIGUIENTE", "valor": "1", "modulo": "General", "descripcion": "Siguiente número correlativo de factura"},
            {"clave": "NUM_REMITO_SIGUIENTE", "valor": "1", "modulo": "General", "descripcion": "Siguiente número correlativo de remito"},
            {"clave": "NUM_PEDIDO_SIGUIENTE", "valor": "1", "modulo": "General", "descripcion": "Siguiente número correlativo de nota de pedido"},
            {"clave": "MODULO_CUENTAS_CORRIENTES", "valor": "true", "modulo": "Configuracion", "descripcion": "Habilitar/Deshabilitar módulo de cuentas corrientes"},
            {"clave": "MODULO_DESPACHO", "valor": "true", "modulo": "Configuracion", "descripcion": "Habilitar/Deshabilitar módulo de despacho y rutas"}
        ]

        for conf in configs:
            ex_conf = db.query(ConfiguracionSistema).filter(ConfiguracionSistema.clave == conf["clave"]).first()
            if not ex_conf:
                db.add(ConfiguracionSistema(**conf))
        db.commit()

        # 7. Seed Permissions (PermisoRol)
        from app.models.permiso_rol import PermisoRol
        
        modulos = [
            "DASHBOARD", "PEDIDOS", "PREPARACION", "COMPROBANTES", 
            "DESPACHO", "CUENTAS_CORRIENTES", "CAJA", "CLIENTES", 
            "PRODUCTOS", "LISTAS_PRECIOS", "CONFIGURACION", 
            "MAPA_VENTAS", "WHATSAPP"
        ]
        
        # Initial rules requested by user
        default_perms = {
            "SUPERADMIN": modulos, # All
            "ADMINISTRATIVO": [
                "DASHBOARD", "PEDIDOS", "CAJA", "COMPROBANTES", 
                "CUENTAS_CORRIENTES", "CLIENTES", "PRODUCTOS", 
                "LISTAS_PRECIOS", "MAPA_VENTAS"
            ],
            "REPARTIDOR": [
                "PREPARACION", "DESPACHO", "CLIENTES", "PRODUCTOS", "LISTAS_PRECIOS"
            ],
            "VENDEDOR": [
                "PREPARACION", "DESPACHO", "CLIENTES", "PRODUCTOS", "LISTAS_PRECIOS", "PEDIDOS"
            ],
            "EMPLEADO": [
                "DASHBOARD" # Initially very limited
            ]
        }
        
        for rol, habilitados in default_perms.items():
            for modulo in modulos:
                exists = db.query(PermisoRol).filter(
                    PermisoRol.rol == rol,
                    PermisoRol.modulo == modulo
                ).first()
                if not exists:
                    perm = PermisoRol(
                        rol=rol,
                        modulo=modulo,
                        habilitado=(modulo in habilitados)
                    )
                    db.add(perm)
        db.commit()

        print("Base de datos J&E inicializada exitosamente.")
    except Exception as e:
        db.rollback()
        print(f"Error al inicializar base de datos: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
