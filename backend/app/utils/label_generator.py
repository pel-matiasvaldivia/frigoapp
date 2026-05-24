import os
import qrcode
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.pagesizes import landscape
from reportlab.lib import colors
from io import BytesIO
from datetime import datetime

# Define label size (10x10 cm)
LABEL_SIZE = (10*cm, 10*cm)

def generate_qr_image(data: str):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=1,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    buffer = BytesIO()
    try:
        # Use PIL (Pillow) if available
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(buffer)
    except Exception:
        # Fallback: write PNG bytes directly
        img = qr.make_image()
        img.save(buffer)
    
    buffer.seek(0)
    return buffer


def generate_labels_pdf(db, orden, bultos):
    """
    Generates a PDF where each page is a 10x10cm label for a bulto.
    """
    filename = f"LABELS_ORD_{orden.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    file_path = f"/app/uploads/{filename}"
    
    doc = SimpleDocTemplate(
        file_path,
        pagesize=LABEL_SIZE,
        rightMargin=0.5*cm,
        leftMargin=0.5*cm,
        topMargin=0.5*cm,
        bottomMargin=0.5*cm
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading2'],
        fontSize=12,
        alignment=1, # Center
        spaceAfter=5
    )
    
    detail_style = ParagraphStyle(
        'DetailStyle',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        alignment=0 # Left
    )

    story = []
    
    for i, bulto in enumerate(bultos):
        # Header Info
        story.append(Paragraph(f"<b>FRIGORIFICO J&E</b>", title_style))
        story.append(Paragraph(f"Bulto {i+1} de {len(bultos)}", detail_style))
        story.append(Paragraph(f"<b>Orden #{orden.pedido_id}</b> | {datetime.now().strftime('%d/%m/%Y')}", detail_style))
        story.append(Spacer(1, 0.2*cm))
        
        # Client Info
        razon_social = orden.pedido.cliente.razon_social if orden.pedido and orden.pedido.cliente else "CLIENTE GENERAL"
        story.append(Paragraph(f"<b>CLIENTE:</b> {razon_social}", detail_style))
        story.append(Spacer(1, 0.2*cm))
        
        # Product and Weight
        story.append(Paragraph(f"<b>PRODUCTO:</b> {bulto.producto.descripcion}", detail_style))
        story.append(Paragraph(f"<b>PESO REAL:</b> {bulto.peso_real_kg} KG", detail_style))
        story.append(Spacer(1, 0.3*cm))
        
        # QR Code
        # We encode the UUID for tracking
        qr_data = bulto.tracking_uuid or f"BULTO-{bulto.id}"
        qr_buffer = generate_qr_image(qr_data)
        qr_img = Image(qr_buffer, width=4*cm, height=4*cm)
        story.append(qr_img)
        
        # Footer tracking code text
        story.append(Paragraph(f"<font size='6'>{qr_data}</font>", ParagraphStyle('Code', parent=detail_style, alignment=1)))
        
        # Add page break if not the last one
        from reportlab.platypus import PageBreak
        if i < len(bultos) - 1:
            story.append(PageBreak())

    doc.build(story)
    return f"/uploads/{filename}"
