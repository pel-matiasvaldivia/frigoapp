from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Argentina/Buenos_Aires",
    enable_utc=True,
    imports=("app.core.celery_app",) # import task modules here
)

@celery_app.task(name="generar_pdf_comprobante_task")
def generar_pdf_comprobante_task(comprobante_id: int):
    # Inline import to avoid circular imports during startup
    from app.core.database import SessionLocal
    from app.models.comprobante import Comprobante
    from app.utils.pdf_generator import generate_pdf_for_comprobante
    
    db = SessionLocal()
    try:
        comprobante = db.query(Comprobante).filter(Comprobante.id == comprobante_id).first()
        if comprobante:
            print(f"[Celery] Generando PDF para comprobante ID {comprobante_id}...")
            pdf_path = generate_pdf_for_comprobante(db, comprobante)
            comprobante.pdf_path = pdf_path
            db.commit()
            print(f"[Celery] PDF generado exitosamente en {pdf_path}")
            return pdf_path
        else:
            print(f"[Celery] Comprobante ID {comprobante_id} no encontrado.")
            return None
    except Exception as e:
        db.rollback()
        print(f"[Celery] Error al generar PDF para comprobante {comprobante_id}: {e}")
        raise e
    finally:
        db.close()

@celery_app.task(name="enviar_notificacion_factura_task")
def enviar_notificacion_factura_task(cliente_id: int, comprobante_id: int):
    from app.core.database import SessionLocal
    from app.models.cliente import Cliente
    from app.models.comprobante import Comprobante
    
    db = SessionLocal()
    try:
        cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
        comprobante = db.query(Comprobante).filter(Comprobante.id == comprobante_id).first()
        if cliente and comprobante:
            # Simulate sending WhatsApp/Email notification
            log_msg = (
                f"[NOTIFICACIÓN] Enviando comprobante {comprobante.numero} ({comprobante.tipo}) "
                f"al cliente {cliente.razon_social} via WhatsApp al {cliente.telefono_whatsapp or 'N/A'}. "
                f"Monto total: ${comprobante.total}."
            )
            print(log_msg)
            return log_msg
        return "Cliente o comprobante no encontrado para notificar."
    finally:
        db.close()
