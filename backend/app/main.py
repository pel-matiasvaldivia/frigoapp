from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.database import engine, Base
from app.db.seed import seed_db

# Import routers
from app.routers import auth, clientes, productos, listas_precios, pedidos, despacho, comprobantes, cuentas_corrientes, configuracion, preparacion, rutas, dashboard, whatsapp

# 1. Initialize DB and Seed Data
try:
    print("Iniciando y migrando base de datos...")
    Base.metadata.create_all(bind=engine)
    
    # Manual migration for whatsapp_id if needed
    from sqlalchemy import text
    with engine.connect() as connection:
        try:
            # Check if column exists, if not add it
            connection.execute(text("ALTER TABLE clientes ADD COLUMN IF NOT EXISTS whatsapp_id VARCHAR"))
            connection.commit()
            print("Migración de whatsapp_id completada.")
        except Exception as migr_err:
            print(f"Aviso migración: {migr_err}")

    seed_db()
except Exception as e:
    print(f"Error al iniciar base de datos: {e}")

# 2. Setup FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API REST para la gestión comercial del Frigorífico de Cerdo J&E",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# 3. CORS Configuration
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS] if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# 4. Mount Uploads folder for direct static serving of PDFs in case Nginx is not fully up
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# 5. Register Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(clientes.router, prefix=settings.API_V1_STR)
app.include_router(productos.router, prefix=settings.API_V1_STR)
app.include_router(listas_precios.router, prefix=settings.API_V1_STR)
app.include_router(pedidos.router, prefix=settings.API_V1_STR)
app.include_router(preparacion.router, prefix=settings.API_V1_STR)
app.include_router(comprobantes.router, prefix=settings.API_V1_STR)
app.include_router(despacho.router, prefix=settings.API_V1_STR)
app.include_router(cuentas_corrientes.router, prefix=settings.API_V1_STR)
app.include_router(rutas.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(configuracion.router, prefix=settings.API_V1_STR)
app.include_router(whatsapp.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Bienvenido al API del Frigorífico de Cerdo J&E",
        "docs": "/docs",
        "version": "1.0.0"
    }
