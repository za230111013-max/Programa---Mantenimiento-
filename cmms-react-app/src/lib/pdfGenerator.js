import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateOrderPDF = (order) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Header ---
    doc.setFillColor(31, 41, 55); // Dark Slate
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE ORDEN DE TRABAJO', 15, 25);
    
    doc.setFontSize(12);
    doc.text(order.folio || 'S/F', pageWidth - 15, 25, { align: 'right' });
    doc.text('CMMS PRO INDUSTRIAL', pageWidth - 15, 32, { align: 'right' });

    // --- General Info Table ---
    autoTable(doc, {
      startY: 50,
      head: [['INFORMACIÓN GENERAL', '']],
      body: [
        ['Título:', order.title || 'N/A'],
        ['Equipo:', order.assetTag || 'N/A'],
        ['Tipo:', (order.type || 'N/A').toUpperCase()],
        ['Prioridad:', order.priority || 'N/A'],
        ['Elaborado por:', order.createdBy || 'Sistema'],
        ['Estado:', (order.status || 'N/A').toUpperCase()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold', width: 40 } }
    });

    // --- Failure Description ---
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE FALLA / DESCRIPCIÓN:', 15, finalY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const description = order.description || 'Sin descripción detallada.';
    const splitDescription = doc.splitTextToSize(description, pageWidth - 30);
    doc.text(splitDescription, 15, finalY + 7);

    // --- Intervention Details ---
    let nextY = finalY + 15 + (splitDescription.length * 5);

    if (order.type === 'preventivo' && order.checklist) {
      autoTable(doc, {
        startY: nextY,
        head: [['CHECKLIST PREVENTIVO', 'ESTADO']],
        body: order.checklist.map(item => [item.task, item.completed ? 'COMPLETADO' : 'PENDIENTE']),
        headStyles: { fillColor: [16, 185, 129] },
        columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } }
      });
      nextY = doc.lastAutoTable.finalY + 10;
    }

    if (order.closure && order.closure.rootCause) {
      autoTable(doc, {
        startY: nextY,
        head: [['ANÁLISIS DE CAUSA RAÍZ (5 WHYS)', '']],
        body: order.closure.rootCause.map((w, i) => [`¿Por qué #${i + 1}?`, w]),
        headStyles: { fillColor: [245, 158, 11] },
        columnStyles: { 0: { fontStyle: 'bold', width: 40 } }
      });
      nextY = doc.lastAutoTable.finalY + 10;
    }

    // --- Metrics Summary ---
    if (order.closure) {
      autoTable(doc, {
        startY: nextY,
        head: [['MÉTRICAS DE CIERRE', 'VALOR']],
        body: [
          ['Tiempo Muerto (Downtime):', `${order.closure.downtime || 0} minutos`],
          ['Impacto en Producción:', (order.closure.impact || 'BAJO').toUpperCase()],
          ['Costo Estimado de Falla:', `$${order.closure.totalCost || 0} MXN`],
          ['Lectura Horómetro:', `${order.closure.meterReading || 0} hrs`],
          ['Fecha de Cierre:', order.closedAt ? new Date(order.closedAt).toLocaleString() : 'N/A'],
        ],
        headStyles: { fillColor: [107, 114, 128] },
        columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
      });
      nextY = doc.lastAutoTable.finalY + 20;
    }

    // --- Signatures ---
    if (nextY > 250) {
      doc.addPage();
      nextY = 30;
    }
    
    doc.setFontSize(10);
    doc.line(15, nextY + 20, 75, nextY + 20);
    doc.text('Firma Responsable', 28, nextY + 25);
    
    doc.line(pageWidth - 75, nextY + 20, pageWidth - 15, nextY + 20);
    doc.text('Firma Validación', pageWidth - 62, nextY + 25);

    // --- Footer ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Generado automáticamente por CMMS PRO Industrial - Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    // --- Open in new tab ---
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error al generar PDF:', error);
    alert('Hubo un error al generar el PDF. Por favor, verifica la consola para más detalles.');
  }
};
