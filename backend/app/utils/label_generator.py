import os
import qrcode
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.pagesizes import landscape
from reportlab.lib import colors
from io import BytesIO
from datetime import datetime

# Define label size (50x30 mm for standard thermal stickers)
from reportlab.lib.units import mm
LABEL_SIZE = (50*mm, 30*mm)

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
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(buffer)
    except Exception:
        img = qr.make_image()
        img.save(buffer)
    
    buffer.seek(0)
    return buffer


def generate_labels_pdf(db, orden, bultos):
    """
    Generates a PDF where each page is a 50x30mm label for a bulto.
    """
    filename = f"LABELS_ORD_{orden.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    file_path = f"/app/uploads/{filename}"
    
    doc = SimpleDocTemplate(
        file_path,
        pagesize=LABEL_SIZE,
        rightMargin=1*mm,
        leftMargin=1*mm,
        topMargin=1*mm,
        bottomMargin=1*mm
    )
    
    styles = getSampleStyleSheet()
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=6,
        leading=7,
        fontName='Helvetica-Bold',
        alignment=0
    )
    
    detail_style = ParagraphStyle(
        'DetailStyle',
        parent=styles['Normal'],
        fontSize=6,
        leading=7,
        alignment=0
    )
    
    prod_style = ParagraphStyle(
        'ProdStyle',
        parent=styles['Normal'],
        fontSize=7,
        leading=8,
        fontName='Helvetica-Bold',
        alignment=0
    )

    story = []
    
    for i, bulto in enumerate(bultos):
        # 1. Prepare Left Column (Text)
        razon_social = orden.pedido.cliente.razon_social if orden.pedido and orden.pedido.cliente else "CLIENTE"
        # Truncate client name for small label
        if len(razon_social) > 20:
            razon_social = razon_social[:18] + ".."
            
        text_elements = [
            Paragraph(f"<b>FRIGORIFICO J&E</b>", header_style),
            Paragraph(f"Ord #{orden.pedido_id} | {datetime.now().strftime('%d/%m')}", detail_style),
            Paragraph(f"Bulto {i+1}/{len(bultos)}", detail_style),
            Spacer(1, 1*mm),
            Paragraph(f"<b>CLIENTE:</b> {razon_social}", detail_style),
            Paragraph(f"<b>PROD:</b> {bulto.producto.descripcion[:25]}", prod_style),
            Paragraph(f"<b>PESO: {bulto.peso_real_kg} KG</b>", prod_style)
        ]
        
        # 2. Prepare Right Column (QR)
        qr_data = bulto.tracking_uuid or f"BULTO-{bulto.id}"
        qr_buffer = generate_qr_image(qr_data)
        qr_img = Image(qr_buffer, width=18*mm, height=18*mm)
        qr_elements = [
            qr_img,
            Paragraph(f"<font size='4'>{qr_data}</font>", ParagraphStyle('Code', parent=detail_style, alignment=1))
        ]
        
        # 3. Create Table for 2-column layout
        # Total width 50mm - 2mm margins = 48mm
        main_table = Table([[text_elements, qr_elements]], colWidths=[30*mm, 18*mm])
        main_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        
        story.append(main_table)
        
        if i < len(bultos) - 1:
            from reportlab.platypus import PageBreak
            story.append(PageBreak())

    doc.build(story)
    return f"/api/uploads/{filename}"
