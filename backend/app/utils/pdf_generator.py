import os
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

from app.core.config import settings
from app.models.comprobante import Comprobante
from app.models.pedido import Pedido
from app.models.cliente import Cliente
from app.models.ruta import Ruta

def generate_pdf_for_comprobante(db: Session, comprobante: Comprobante) -> str:
    # 1. Gather all info
    pedido = db.query(Pedido).filter(Pedido.id == comprobante.pedido_id).first()
    cliente = db.query(Cliente).filter(Cliente.id == pedido.cliente_id).first()
    ruta = db.query(Ruta).filter(Ruta.id == cliente.ruta_id).first() if cliente.ruta_id else None
    
    # Define file name
    filename = f"{comprobante.tipo}_{comprobante.numero.replace('/', '_').replace('-', '_')}.pdf"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    # 2. Setup document
    is_thermal = comprobante.tipo == "REMITO"
    from reportlab.lib.units import mm
    
    if is_thermal:
        page_width = 80 * mm
        # For thermal printers, height can be theoretically infinite, 
        # but reportlab needs a fixed height per page. 
        # We use a large enough height to avoid page breaks in most cases, or just standard 297mm (A4 height).
        page_height = 297 * mm 
        doc = SimpleDocTemplate(
            file_path,
            pagesize=(page_width, page_height),
            rightMargin=2*mm, leftMargin=2*mm, topMargin=5*mm, bottomMargin=5*mm
        )
        content_width = page_width - 4*mm
    else:
        doc = SimpleDocTemplate(
            file_path,
            pagesize=letter,
            rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
        )
        content_width = 6.5 * inch # approx for letter minus margins
    
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18 if is_thermal else 24,
        leading=20 if is_thermal else 28,
        textColor=colors.HexColor('#1e293b'),
        alignment=1 if is_thermal else 0 # Centered for thermal
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8 if is_thermal else 10,
        leading=10 if is_thermal else 14,
        textColor=colors.HexColor('#475569')
    )
    
    meta_val_style = ParagraphStyle(
        'MetaValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8 if is_thermal else 10,
        leading=10 if is_thermal else 14,
        textColor=colors.HexColor('#334155')
    )
    
    meta_title_style = ParagraphStyle(
        'MetaTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9 if is_thermal else 12,
        leading=12 if is_thermal else 16,
        textColor=colors.HexColor('#0f172a')
    )
    
    table_hdr_style = ParagraphStyle(
        'TableHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7 if is_thermal else 9,
        leading=9 if is_thermal else 12,
        textColor=colors.white
    )
    
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7 if is_thermal else 9,
        leading=9 if is_thermal else 12,
        textColor=colors.HexColor('#334155')
    )
    
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7 if is_thermal else 9,
        leading=9 if is_thermal else 12,
        textColor=colors.HexColor('#0f172a')
    )

    # 3. Add Header (Company & Doc details)
    if is_thermal:
        # Stacked for thermal
        story.append(Paragraph(f"<b>{settings.EMPRESA_NOMBRE}</b>", title_style))
        story.append(Spacer(1, 5))
        story.append(Paragraph(
            f"CUIT: {settings.EMPRESA_CUIT}<br/>"
            f"Dir: {settings.EMPRESA_DIRECCION}<br/>"
            f"Tel: {settings.EMPRESA_TELEFONO}",
            header_style
        ))
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"<font color='#2563eb'><b>REMITO DE DESPACHO</b></font>", ParagraphStyle('thermalLabel', parent=meta_val_style, fontSize=12, alignment=1)))
        story.append(Paragraph(f"<b>NÚMERO:</b> {comprobante.numero}", meta_val_style))
        story.append(Paragraph(f"<b>FECHA:</b> {comprobante.fecha.strftime('%d/%m/%Y %H:%M')}", meta_val_style))
        story.append(Spacer(1, 5))
        story.append(Paragraph("-" * 40, header_style)) # Simple separator
    else:
        # Side by side for A4/Letter
        company_p = Paragraph(
            f"<b>{settings.EMPRESA_NOMBRE}</b><br/>"
            f"CUIT: {settings.EMPRESA_CUIT}<br/>"
            f"Dirección: {settings.EMPRESA_DIRECCION}<br/>"
            f"Teléfono: {settings.EMPRESA_TELEFONO}<br/>"
            f"Email: {settings.EMPRESA_EMAIL}",
            header_style
        )
        doc_type_label = "FACTURA" if comprobante.tipo == "FACTURA" else "REMITO DE DESPACHO"
        doc_meta_p = Paragraph(
            f"<font size=16 color='#2563eb'><b>{doc_type_label}</b></font><br/>"
            f"<b>NÚMERO:</b> {comprobante.numero}<br/>"
            f"<b>FECHA:</b> {comprobante.fecha.strftime('%d/%m/%Y %H:%M')}<br/>"
            f"<b>ESTADO:</b> {comprobante.estado}<br/>",
            meta_val_style
        )
        header_table = Table([[company_p, doc_meta_p]], colWidths=[3.2*inch, 4.0*inch])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 15),
            ('LINEBELOW', (0,0), (-1,-1), 1.5, colors.HexColor('#cbd5e1')),
        ]))
        story.append(header_table)
    
    story.append(Spacer(1, 10))
    
    # 4. Add Customer details
    if is_thermal:
        story.append(Paragraph(f"<b>CLIENTE:</b> {cliente.razon_social}", meta_val_style))
        story.append(Paragraph(f"<b>CUIT:</b> {cliente.cuit or 'Consumidor Final'}", meta_val_style))
        story.append(Paragraph(f"<b>DIR:</b> {cliente.direccion}", meta_val_style))
        story.append(Paragraph(f"<b>RUTA:</b> {ruta.nombre if ruta else 'S/A'}", meta_val_style))
    else:
        customer_p1 = Paragraph(
            f"<b>CLIENTE:</b> {cliente.razon_social}<br/>"
            f"<b>CUIT:</b> {cliente.cuit or 'Consumidor Final'}<br/>"
            f"<b>DIRECCIÓN:</b> {cliente.direccion}",
            meta_val_style
        )
        customer_p2 = Paragraph(
            f"<b>RUTA:</b> {ruta.nombre if ruta else 'Sin Asignar'}<br/>"
            f"<b>ZONA:</b> {ruta.zona if ruta else ''}<br/>"
            f"<b>WHATSAPP:</b> {cliente.telefono_whatsapp or 'N/A'}",
            meta_val_style
        )
        customer_table = Table([[customer_p1, customer_p2]], colWidths=[3.6*inch, 3.6*inch])
        customer_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(customer_table)
        
    story.append(Spacer(1, 15))
    
    # 5. Add Items table
    if is_thermal:
        table_data = [[
            Paragraph("Descripción", table_hdr_style),
            Paragraph("Cant/Peso", table_hdr_style),
            Paragraph("Precio", table_hdr_style),
            Paragraph("Subt", table_hdr_style)
        ]]
        # 80mm width minus ~4mm margins = ~76mm
        col_widths = [32*mm, 16*mm, 14*mm, 14*mm]
    else:
        table_data = [[
            Paragraph("Código", table_hdr_style),
            Paragraph("Descripción", table_hdr_style),
            Paragraph("Unids", table_hdr_style),
            Paragraph("Peso Real (kg)", table_hdr_style),
            Paragraph("Precio / kg", table_hdr_style),
            Paragraph("Subtotal", table_hdr_style)
        ]]
        col_widths = [1.0*inch, 2.5*inch, 0.7*inch, 1.1*inch, 1.0*inch, 1.1*inch]
    
    for item in pedido.items:
        weight = item.peso_real_kg if item.peso_real_kg > 0 else item.peso_estimado_kg
        sub = item.subtotal if item.peso_real_kg > 0 else round(item.precio_unitario * weight, 2)
        
        if is_thermal:
            table_data.append([
                Paragraph(item.producto.descripcion, table_cell_style),
                Paragraph(f"{weight:.1f}kg", table_cell_style),
                Paragraph(f"${item.precio_unitario:,.0f}", table_cell_style),
                Paragraph(f"${sub:,.0f}", table_cell_bold)
            ])
        else:
            prefix = cliente.lista_precios_id or 1
            item_code = f"{prefix}{item.producto.codigo}"
            table_data.append([
                Paragraph(item_code, table_cell_style),
                Paragraph(item.producto.descripcion, table_cell_style),
                Paragraph(f"{item.cantidad_unidades:.1f}", table_cell_style),
                Paragraph(f"{weight:.2f} kg", table_cell_style),
                Paragraph(f"${item.precio_unitario:,.2f}", table_cell_style),
                Paragraph(f"${sub:,.2f}", table_cell_bold)
            ])
        
    # Totals Row
    if is_thermal:
        table_data.append([
            "", "", Paragraph("TOTAL:", table_cell_bold),
            Paragraph(f"${comprobante.total:,.0f}", table_cell_bold)
        ])
    else:
        table_data.append([
            "", "", "", "",
            Paragraph("TOTAL:", ParagraphStyle('TotalLbl', parent=table_cell_bold, fontSize=11)),
            Paragraph(f"${comprobante.total:,.2f}", ParagraphStyle('TotalVal', parent=table_cell_bold, fontSize=11, textColor=colors.HexColor('#2563eb')))
        ])
    
    items_table = Table(table_data, colWidths=col_widths)
    items_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4 if is_thermal else 8),
        ('TOPPADDING', (0,0), (-1,-1), 4 if is_thermal else 8),
        ('GRID', (0,0), (-1,-2), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 15))
    
    # 6. Add Signature Area
    if is_thermal:
        story.append(Paragraph("<b>FIRMA CONFORMIDAD:</b>", meta_val_style))
        if comprobante.firma_repartidor_path and os.path.exists(comprobante.firma_repartidor_path):
            from reportlab.platypus import Image
            sig_img = Image(comprobante.firma_repartidor_path, width=40*mm, height=20*mm)
            story.append(sig_img)
        else:
            story.append(Spacer(1, 15*mm))
            story.append(Paragraph("." * 40, header_style))
        story.append(Paragraph("¡Gracias por su confianza!", ParagraphStyle('thanks', parent=header_style, alignment=1)))
    else:
        if comprobante.firma_repartidor_path and os.path.exists(comprobante.firma_repartidor_path):
            from reportlab.platypus import Image
            sig_img = Image(comprobante.firma_repartidor_path, width=2.0*inch, height=1.0*inch)
            sig_cell = [Paragraph("<b>Firma del Cliente (Conformidad):</b>", meta_title_style), Spacer(1, 5), sig_img]
        else:
            sig_cell = [Paragraph("<b>Firma del Cliente (Conformidad):</b>", meta_title_style), Spacer(1, 40), Paragraph("___________________________", meta_val_style)]
            
        term_cell = [
            Paragraph("<b>Condiciones de Pago:</b>", meta_title_style),
            Paragraph(f"Factura con vencimiento a 15 días.<br/>Límite de crédito asignado: ${cliente.limite_credito:,.2f}<br/>Gracias por su compra.", meta_val_style)
        ]
        footer_table = Table([[term_cell, sig_cell]], colWidths=[4.2*inch, 3.0*inch])
        footer_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(footer_table)
    
    # Build Document
    doc.build(story)
    
    # Return relative URL path
    return f"/api/uploads/{filename}"
