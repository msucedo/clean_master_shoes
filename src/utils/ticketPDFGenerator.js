/**
 * Generador de PDFs para Tickets Térmicos
 * Optimizado para impresoras de 58mm
 * Compatible con Thermer y otras apps de impresión en iOS
 */

import jsPDF from 'jspdf';

// Constantes para impresora 58mm
const TICKET_WIDTH_MM = 58;
const MARGIN_MM = 2;
const CONTENT_WIDTH_MM = TICKET_WIDTH_MM - (MARGIN_MM * 2);
const FONT_SIZE_NORMAL = 8;
const FONT_SIZE_LARGE = 10;
const FONT_SIZE_TITLE = 12;
const LINE_HEIGHT = 3.5;

// Caracteres que caben por línea (aproximado para Courier 8pt en 54mm)
const MAX_CHARS_PER_LINE = 32;
const MAX_CHARS_WITH_PRICE = 24; // Cuando hay precio a la derecha

/**
 * Formatear fecha ISO a formato legible: DD/MM/YYYY HH:mm AM/PM
 * Maneja tanto fechas simples (YYYY-MM-DD) como timestamps completos
 * @param {string} isoString - Fecha en formato ISO o YYYY-MM-DD
 * @param {boolean} useCurrentIfEmpty - Si true, usa fecha actual cuando isoString está vacío
 */
const formatDate = (isoString, useCurrentIfEmpty = false) => {
  // Si está vacío y se solicita usar fecha actual
  if (!isoString && useCurrentIfEmpty) {
    isoString = new Date().toISOString();
  }

  if (!isoString) return '';

  let date;

  // Detectar si es solo fecha (YYYY-MM-DD) o un timestamp completo
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    // Es solo fecha (YYYY-MM-DD) - parsear como local para evitar problema de zona horaria
    const [year, month, day] = isoString.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    // Es un timestamp completo - parsear normalmente
    date = new Date(isoString);
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = hours.toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
};

/**
 * Dividir texto largo en múltiples líneas
 */
const wrapText = (text, maxChars) => {
  if (!text || text.length <= maxChars) {
    return [text];
  }

  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= maxChars) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      // Si una palabra sola es más larga que maxChars, dividirla
      if (word.length > maxChars) {
        let remainingWord = word;
        while (remainingWord.length > maxChars) {
          lines.push(remainingWord.substring(0, maxChars));
          remainingWord = remainingWord.substring(maxChars);
        }
        currentLine = remainingWord;
      } else {
        currentLine = word;
      }
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

/**
 * Generar PDF de ticket de recepción
 */
export const generateReceiptTicketPDF = (order, businessInfo) => {
  // Crear PDF en formato de ticket (58mm de ancho)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [TICKET_WIDTH_MM, 297] // Alto inicial, se ajustará automáticamente
  });

  let yPos = MARGIN_MM;

  // Fuente monoespaciada para mejor alineación
  pdf.setFont('courier');

  // === ENCABEZADO ===
  pdf.setFontSize(FONT_SIZE_TITLE);
  pdf.setFont('courier', 'bold');

  // Nombre del negocio (centrado)
  const businessName = businessInfo.businessName || 'CLEAN MASTER SHOES';
  pdf.text(businessName, TICKET_WIDTH_MM / 2, yPos, { align: 'center' });
  yPos += LINE_HEIGHT + 1;

  pdf.setFontSize(FONT_SIZE_NORMAL);
  pdf.setFont('courier', 'normal');

  // Información del negocio
  if (businessInfo.address) {
    pdf.text(businessInfo.address, TICKET_WIDTH_MM / 2, yPos, { align: 'center' });
    yPos += LINE_HEIGHT;
  }
  if (businessInfo.phone) {
    pdf.text(`Tel: ${businessInfo.phone}`, TICKET_WIDTH_MM / 2, yPos, { align: 'center' });
    yPos += LINE_HEIGHT;
  }
  if (businessInfo.website) {
    pdf.text(businessInfo.website, TICKET_WIDTH_MM / 2, yPos, { align: 'center' });
    yPos += LINE_HEIGHT;
  }

  // Línea separadora
  yPos += 1;
  pdf.line(MARGIN_MM, yPos, TICKET_WIDTH_MM - MARGIN_MM, yPos);
  yPos += LINE_HEIGHT;

  // === TÍTULO ===
  pdf.setFontSize(FONT_SIZE_LARGE);
  pdf.setFont('courier', 'bold');
  pdf.text('TICKET DE RECEPCION', TICKET_WIDTH_MM / 2, yPos, { align: 'center' });
  yPos += LINE_HEIGHT + 1;

  // Línea separadora
  pdf.line(MARGIN_MM, yPos, TICKET_WIDTH_MM - MARGIN_MM, yPos);
  yPos += LINE_HEIGHT;

  // === INFORMACIÓN DE LA ORDEN ===
  pdf.setFontSize(FONT_SIZE_NORMAL);
  pdf.setFont('courier', 'normal');

  pdf.text(`Orden: #${order.orderNumber || 'N/A'}`, MARGIN_MM, yPos);
  yPos += LINE_HEIGHT;

  pdf.text(`Cliente: ${order.client || 'N/A'}`, MARGIN_MM, yPos);
  yPos += LINE_HEIGHT;

  if (order.phone) {
    pdf.text(`Tel: ${order.phone}`, MARGIN_MM, yPos);
    yPos += LINE_HEIGHT;
  }

  pdf.text(`Fecha: ${formatDate(order.createdAt, true)}`, MARGIN_MM, yPos);
  yPos += LINE_HEIGHT;

  if (order.deliveryDate) {
    pdf.text(`Entrega: ${formatDate(order.deliveryDate)}`, MARGIN_MM, yPos);
    yPos += LINE_HEIGHT;
  }

  // Línea separadora
  yPos += 1;
  pdf.line(MARGIN_MM, yPos, TICKET_WIDTH_MM - MARGIN_MM, yPos);
  yPos += LINE_HEIGHT;

  // === SERVICIOS ===
  if (order.services && order.services.length > 0) {
    pdf.setFont('courier', 'bold');
    pdf.text('SERVICIOS:', MARGIN_MM, yPos);
    yPos += LINE_HEIGHT;
    pdf.setFont('courier', 'normal');

    // Agrupar servicios por nombre
    const grouped = {};
    const serviceNotes = {}; // Guardar notas de cada grupo

    order.services
      .filter(s => s.status !== 'cancelled')
      .forEach(service => {
        const serviceName = service.serviceName || 'Servicio';
        if (!grouped[serviceName]) {
          grouped[serviceName] = {
            serviceName: serviceName,
            price: service.price || 0,
            quantity: 0
          };
          // Guardar la primera nota encontrada para este servicio
          if (service.notes && service.notes.trim()) {
            serviceNotes[serviceName] = service.notes;
          }
        }
        grouped[serviceName].quantity++;
      });

    // Renderizar servicios agrupados
    Object.values(grouped).forEach(service => {
      const serviceName = service.serviceName;
      const totalPrice = `$${(service.price * service.quantity).toFixed(2)}`;
      const qty = service.quantity > 1 ? ` x${service.quantity}` : '';

      // Nombre completo con cantidad
      const fullName = `${serviceName}${qty}`;

      // Dividir en líneas si es muy largo
      const lines = wrapText(fullName, MAX_CHARS_WITH_PRICE);

      // Imprimir primera línea con precio
      pdf.text(lines[0], MARGIN_MM, yPos);
      pdf.text(totalPrice, TICKET_WIDTH_MM - MARGIN_MM, yPos, { align: 'right' });
      yPos += LINE_HEIGHT;

      // Imprimir líneas adicionales si existen
      for (let i = 1; i < lines.length; i++) {
        pdf.text(lines[i], MARGIN_MM, yPos);
        yPos += LINE_HEIGHT;
      }

      // Agregar notas del servicio si existen
      if (serviceNotes[serviceName]) {
        pdf.setFontSize(FONT_SIZE_NORMAL - 1);
        pdf.setFont('courier', 'italic');
        const noteLines = wrapText(`  Nota: ${serviceNotes[serviceName]}`, MAX_CHARS_PER_LINE);
        noteLines.forEach(noteLine => {
          pdf.text(noteLine, MARGIN_MM, yPos);
          yPos += LINE_HEIGHT - 0.5;
        });
        pdf.setFontSize(FONT_SIZE_NORMAL);
        pdf.setFont('courier', 'normal');
      }
    });
  }

  // === PRODUCTOS ===
  if (order.products && order.products.length > 0) {
    yPos += 1;
    pdf.setFont('courier', 'bold');
    pdf.text('PRODUCTOS:', MARGIN_MM, yPos);
    yPos += LINE_HEIGHT;
    pdf.setFont('courier', 'normal');

    order.products.forEach(product => {
      const productName = product.productName || 'Producto';
      const price = `$${(product.price || 0).toFixed(2)}`;
      const qty = product.quantity > 1 ? ` x${product.quantity}` : '';

      // Nombre completo con cantidad
      const fullName = `${productName}${qty}`;

      // Dividir en líneas si es muy largo
      const lines = wrapText(fullName, MAX_CHARS_WITH_PRICE);

      // Imprimir primera línea con precio
      pdf.text(lines[0], MARGIN_MM, yPos);
      pdf.text(price, TICKET_WIDTH_MM - MARGIN_MM, yPos, { align: 'right' });
      yPos += LINE_HEIGHT;

      // Imprimir líneas adicionales si existen
      for (let i = 1; i < lines.length; i++) {
        pdf.text(lines[i], MARGIN_MM, yPos);
        yPos += LINE_HEIGHT;
      }
    });
  }

  // Línea separadora
  yPos += 1;
  pdf.line(MARGIN_MM, yPos, TICKET_WIDTH_MM - MARGIN_MM, yPos);
  yPos += LINE_HEIGHT;

  // === TOTALES ===
  pdf.setFont('courier', 'bold');

  const total = order.totalPrice || 0;
  const anticipo = order.advancePayment || 0;
  const saldo = total - anticipo;

  pdf.text('TOTAL:', MARGIN_MM, yPos);
  pdf.text(`$${total.toFixed(2)}`, TICKET_WIDTH_MM - MARGIN_MM, yPos, { align: 'right' });
  yPos += LINE_HEIGHT;

  if (anticipo > 0) {
    pdf.text('ANTICIPO:', MARGIN_MM, yPos);
    pdf.text(`$${anticipo.toFixed(2)}`, TICKET_WIDTH_MM - MARGIN_MM, yPos, { align: 'right' });
    yPos += LINE_HEIGHT;
  }

  pdf.text('SALDO:', MARGIN_MM, yPos);
  pdf.text(`$${saldo.toFixed(2)}`, TICKET_WIDTH_MM - MARGIN_MM, yPos, { align: 'right' });
  yPos += LINE_HEIGHT;

  // Línea separadora
  yPos += 1;
  pdf.line(MARGIN_MM, yPos, TICKET_WIDTH_MM - MARGIN_MM, yPos);
  yPos += LINE_HEIGHT + 2;

  // === PIE ===
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(FONT_SIZE_NORMAL - 1);

  pdf.text('Gracias por su preferencia', TICKET_WIDTH_MM / 2, yPos, { align: 'center' });
  yPos += LINE_HEIGHT;

  if (businessInfo.website) {
    pdf.text(businessInfo.website, TICKET_WIDTH_MM / 2, yPos, { align: 'center' });
    yPos += LINE_HEIGHT;
  }

  yPos += 5; // Espacio final

  return pdf;
};

/**
 * Generar PDF de comprobante de entrega
 */
export const generateDeliveryTicketPDF = (order, businessInfo) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [TICKET_WIDTH_MM, 297]
  });

  let yPos = MARGIN_MM;
  pdf.setFont('courier');

  // === ENCABEZADO ===
  pdf.setFontSize(FONT_SIZE_TITLE);
  pdf.setFont('courier', 'bold');

  const businessName = businessInfo.businessName || 'CLEAN MASTER SHOES';
  pdf.text(businessName, TICKET_WIDTH_MM / 2, yPos, { align: 'center' });
  yPos += LINE_HEIGHT + 1;

  pdf.setFontSize(FONT_SIZE_NORMAL);
  pdf.setFont('courier', 'normal');

  if (businessInfo.phone) {
    pdf.text(`Tel: ${businessInfo.phone}`, TICKET_WIDTH_MM / 2, yPos, { align: 'center' });
    yPos += LINE_HEIGHT;
  }

  yPos += 1;
  pdf.line(MARGIN_MM, yPos, TICKET_WIDTH_MM - MARGIN_MM, yPos);
  yPos += LINE_HEIGHT;

  // === TÍTULO ===
  pdf.setFontSize(FONT_SIZE_LARGE);
  pdf.setFont('courier', 'bold');
  pdf.text('COMPROBANTE DE ENTREGA', TICKET_WIDTH_MM / 2, yPos, { align: 'center' });
  yPos += LINE_HEIGHT + 1;

  pdf.line(MARGIN_MM, yPos, TICKET_WIDTH_MM - MARGIN_MM, yPos);
  yPos += LINE_HEIGHT;

  // === INFORMACIÓN ===
  pdf.setFontSize(FONT_SIZE_NORMAL);
  pdf.setFont('courier', 'normal');

  pdf.text(`Orden: #${order.orderNumber || 'N/A'}`, MARGIN_MM, yPos);
  yPos += LINE_HEIGHT;

  pdf.text(`Cliente: ${order.client || 'N/A'}`, MARGIN_MM, yPos);
  yPos += LINE_HEIGHT;

  pdf.text(`Fecha: ${formatDate(new Date().toISOString())}`, MARGIN_MM, yPos);
  yPos += LINE_HEIGHT + 2;

  // === PAGO EN ENTREGA ===
  const pagoEntrega = (order.totalPrice || 0) - (order.advancePayment || 0);

  if (pagoEntrega > 0) {
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(FONT_SIZE_LARGE);

    yPos += 1;
    pdf.line(MARGIN_MM, yPos, TICKET_WIDTH_MM - MARGIN_MM, yPos);
    yPos += LINE_HEIGHT;

    pdf.text('PAGO EN ENTREGA:', MARGIN_MM, yPos);
    yPos += LINE_HEIGHT;

    pdf.text(`$${pagoEntrega.toFixed(2)}`, TICKET_WIDTH_MM / 2, yPos, { align: 'center' });
    yPos += LINE_HEIGHT;

    pdf.line(MARGIN_MM, yPos, TICKET_WIDTH_MM - MARGIN_MM, yPos);
    yPos += LINE_HEIGHT + 2;
  }

  // === MÉTODO DE PAGO ===
  if (order.paymentMethod) {
    const paymentMethodMap = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'transfer': 'Transferencia',
      'pending': 'Pendiente'
    };

    pdf.setFontSize(FONT_SIZE_NORMAL);
    pdf.setFont('courier', 'normal');

    pdf.text('Metodo de pago:', MARGIN_MM, yPos);
    yPos += LINE_HEIGHT;

    pdf.text(paymentMethodMap[order.paymentMethod] || order.paymentMethod, MARGIN_MM, yPos);
    yPos += LINE_HEIGHT + 2;
  }

  // === FIRMA ===
  yPos += 5;
  pdf.line(MARGIN_MM + 5, yPos, TICKET_WIDTH_MM - MARGIN_MM - 5, yPos);
  yPos += LINE_HEIGHT;

  pdf.text('Firma del cliente', TICKET_WIDTH_MM / 2, yPos, { align: 'center' });
  yPos += LINE_HEIGHT + 3;

  // === PIE ===
  pdf.setFontSize(FONT_SIZE_NORMAL - 1);
  pdf.text('Gracias por su preferencia', TICKET_WIDTH_MM / 2, yPos, { align: 'center' });
  yPos += LINE_HEIGHT;

  if (businessInfo.website) {
    pdf.text(businessInfo.website, TICKET_WIDTH_MM / 2, yPos, { align: 'center' });
  }

  yPos += 5;

  return pdf;
};

/**
 * Generar PDF y retornar como Blob
 */
export const generateTicketPDFBlob = async (order, businessInfo, ticketType) => {
  let pdf;

  if (ticketType === 'receipt') {
    pdf = generateReceiptTicketPDF(order, businessInfo);
  } else if (ticketType === 'delivery') {
    pdf = generateDeliveryTicketPDF(order, businessInfo);
  } else {
    throw new Error('Tipo de ticket inválido');
  }

  // Retornar como Blob
  return pdf.output('blob');
};
