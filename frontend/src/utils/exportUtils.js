import { jsPDF } from 'jspdf';

/**
 * Exportar conversación a formato TXT
 */
export const exportToTXT = (messages, conversationId) => {
  let txtContent = `Conversación ID: ${conversationId}\n`;
  txtContent += `Fecha de exportación: ${new Date().toLocaleString('es-ES')}\n`;
  txtContent += `Total de mensajes: ${messages.length}\n`;
  txtContent += '='.repeat(80) + '\n\n';

  messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? 'TÚ' : 'GEMINI AI';
    const timestamp = new Date(msg.timestamp).toLocaleString('es-ES');
    
    txtContent += `[${index + 1}] ${role} - ${timestamp}\n`;
    txtContent += '-'.repeat(80) + '\n';
    txtContent += `${msg.text}\n\n`;
  });

  txtContent += '='.repeat(80) + '\n';
  txtContent += 'Exportado desde Gemini AI Chat\n';

  // Crear y descargar archivo
  const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `conversacion_${conversationId}_${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exportar conversación a formato PDF
 */
export const exportToPDF = (messages, conversationId) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Función auxiliar para agregar nueva página
  const addPageIfNeeded = (requiredSpace) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Conversación Gemini AI', margin, yPosition);
  yPosition += 10;

  // Metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`ID: ${conversationId}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Fecha: ${new Date().toLocaleString('es-ES')}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Mensajes: ${messages.length}`, margin, yPosition);
  yPosition += 12;

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Mensajes
  messages.forEach((msg, index) => {
    const isUser = msg.role === 'user';
    const role = isUser ? 'TÚ' : 'GEMINI AI';
    const timestamp = new Date(msg.timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Encabezado del mensaje
    addPageIfNeeded(20);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    if (isUser) {
      doc.setTextColor(41, 128, 185); // Azul para usuario
    } else {
      doc.setTextColor(142, 68, 173); // Morado para IA
    }
    doc.text(`${role}`, margin, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(timestamp, margin + 40, yPosition);
    yPosition += 7;

    // Contenido del mensaje
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const lines = doc.splitTextToSize(msg.text, maxWidth);
    lines.forEach((line) => {
      addPageIfNeeded(6);
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });

    yPosition += 8;

    // Línea separadora entre mensajes
    if (index < messages.length - 1) {
      addPageIfNeeded(2);
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    }
  });

  // Footer en última página
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${totalPages} - Gemini AI Chat`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Descargar PDF
  doc.save(`conversacion_${conversationId}_${Date.now()}.pdf`);
};

/**
 * Exportar todas las conversaciones a TXT
 */
export const exportAllToTXT = (allConversations) => {
  let txtContent = `Historial Completo de Conversaciones\n`;
  txtContent += `Fecha de exportación: ${new Date().toLocaleString('es-ES')}\n`;
  txtContent += `Total de conversaciones: ${allConversations.length}\n`;
  txtContent += '='.repeat(80) + '\n\n';

  allConversations.forEach((conv, convIndex) => {
    txtContent += `\n${'*'.repeat(80)}\n`;
    txtContent += `CONVERSACIÓN #${convIndex + 1}\n`;
    txtContent += `ID: ${conv.conversationId}\n`;
    txtContent += `${'*'.repeat(80)}\n\n`;

    conv.messages.forEach((msg, msgIndex) => {
      const role = msg.role === 'user' ? 'TÚ' : 'GEMINI AI';
      const timestamp = new Date(msg.timestamp).toLocaleString('es-ES');
      
      txtContent += `[${msgIndex + 1}] ${role} - ${timestamp}\n`;
      txtContent += '-'.repeat(80) + '\n';
      txtContent += `${msg.text}\n\n`;
    });
  });

  txtContent += '\n' + '='.repeat(80) + '\n';
  txtContent += 'Exportado desde Gemini AI Chat\n';

  const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `historial_completo_${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
