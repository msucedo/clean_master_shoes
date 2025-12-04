/**
 * Formateadores de Tickets para Clean Master Shoes
 * Genera tickets de recepción y entrega en formato HTML y texto plano
 */

import { createESCPOS } from './escposCommands.js';

// ===== HELPERS =====

/**
 * Formatear fecha ISO a formato legible: DD/MM/YYYY HH:mm AM/PM
 * Maneja tanto fechas simples (YYYY-MM-DD) como timestamps completos
 * @param {string} isoString - Fecha en formato ISO o YYYY-MM-DD
 * @param {boolean} useCurrentIfEmpty - Si true, usa fecha actual cuando isoString está vacío
 */
export const formatDate = (isoString, useCurrentIfEmpty = false) => {
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
  hours = hours ? hours : 12; // 0 -> 12
  const hoursStr = hours.toString().padStart(2, '0');

  return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
};

/**
 * Formatear número a moneda: $XXX.XX
 */
export const formatCurrency = (number) => {
  if (number === null || number === undefined) return '$0.00';
  return `$${parseFloat(number).toFixed(2)}`;
};

// ===== FORMATEADORES HTML =====

/**
 * Genera HTML para ticket de recepción (orden recibida)
 * @param {object} copyInfo - Información de la copia (ej: "COPIA CLIENTE", "COPIA NEGOCIO")
 */
export const formatReceiptTicketHTML = (order, businessInfo, copyInfo = null) => {
  // Calcular saldo pendiente
  const saldo = (order.totalPrice || 0) - (order.advancePayment || 0);

  // Construir lista de items
  let itemsHTML = '';

  // Services (agrupar por nombre)
  if (order.services && order.services.length > 0) {
    // Agrupar servicios por nombre
    const grouped = {};
    order.services.forEach(service => {
      const serviceName = service.serviceName || 'Servicio';
      if (!grouped[serviceName]) {
        grouped[serviceName] = {
          serviceName: serviceName,
          price: service.price || 0,
          quantity: 0
        };
      }
      grouped[serviceName].quantity++;
    });

    // Renderizar servicios agrupados
    Object.values(grouped).forEach(service => {
      const name = service.serviceName;
      const qty = service.quantity;
      const totalPrice = service.price * service.quantity;
      const dots = '.'.repeat(Math.max(1, 28 - name.length - qty.toString().length - 3 - formatCurrency(totalPrice).length));
      itemsHTML += `    <div>• ${name} x${qty} ${dots} ${formatCurrency(totalPrice)}</div>\n`;
    });
  }

  // Products
  if (order.products && order.products.length > 0) {
    order.products.forEach(product => {
      const name = product.name || 'Producto';
      const qty = product.quantity || 1;
      const price = product.salePrice || 0;
      const dots = '.'.repeat(Math.max(1, 28 - name.length - qty.toString().length - 3 - formatCurrency(price).length));
      itemsHTML += `    <div>• ${name} x${qty} ${dots} ${formatCurrency(price)}</div>\n`;
    });
  }

  // ShoePairs
  if (order.shoePairs && order.shoePairs.length > 0) {
    order.shoePairs.forEach(pair => {
      const name = `${pair.model || 'Zapato'} - ${pair.service || 'Servicio'}`;
      const qty = pair.quantity || 1;
      const price = pair.price || 0;
      const dots = '.'.repeat(Math.max(1, 28 - name.length - qty.toString().length - 3 - formatCurrency(price).length));
      itemsHTML += `    <div>• ${name} x${qty} ${dots} ${formatCurrency(price)}</div>\n`;
    });
  }

  // OtherItems
  if (order.otherItems && order.otherItems.length > 0) {
    order.otherItems.forEach(item => {
      const name = item.description || 'Item';
      const qty = item.quantity || 1;
      const price = item.price || 0;
      const dots = '.'.repeat(Math.max(1, 28 - name.length - qty.toString().length - 3 - formatCurrency(price).length));
      itemsHTML += `    <div>• ${name} x${qty} ${dots} ${formatCurrency(price)}</div>\n`;
    });
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket de Recepción #${order.orderNumber || ''}</title>
  <style>
    @page {
      margin: 0;
      size: 58mm auto;
    }

    body {
      width: 58mm;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      margin: 0;
      padding: 5mm;
      line-height: 1.3;
    }

    .center {
      text-align: center;
    }

    .bold {
      font-weight: bold;
    }

    .large {
      font-size: 12pt;
    }

    .line {
      border-top: 1px dashed #000;
      margin: 5px 0;
    }

    .separator {
      text-align: center;
      margin: 5px 0;
    }

    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="center separator">==============================</div>
  ${copyInfo ? `<div class="center bold" style="margin: 5px 0;">========= ${copyInfo} =========</div>` : ''}
  <div class="center bold large">${businessInfo.businessName || 'CLEAN MASTER SHOES'}</div>
  <div class="center">Tel: ${businessInfo.phone || ''}</div>
  <div class="center">${businessInfo.address || ''}</div>
  <div class="center separator">==============================</div>

  <div class="center bold large" style="margin: 10px 0;">═══ ORDEN RECIBIDA ═══</div>

  <div>
    <div>Orden #: ${order.orderNumber || ''}</div>
    <div>Fecha: ${formatDate(order.createdAt, true)}</div>
    <div>Cliente: ${order.client || ''}</div>
    <div>Tel: ${order.phone || ''}</div>
  </div>

  <div class="line"></div>

  <div class="bold">DETALLE:</div>
${itemsHTML}

  <div class="line"></div>

  <div>
    <div>Subtotal: ${'.'.repeat(13)} ${formatCurrency(order.subtotal || order.totalPrice)}</div>
    ${order.totalDiscount && order.totalDiscount > 0 ? `<div>Descuento: ${'.'.repeat(12)} -${formatCurrency(order.totalDiscount)}</div>` : ''}
    <div class="bold">TOTAL: ${'.'.repeat(16)} ${formatCurrency(order.totalPrice)}</div>
    <div>Anticipo: ${'.'.repeat(13)} ${formatCurrency(order.advancePayment)}</div>
    <div class="bold">SALDO: ${'.'.repeat(16)} ${formatCurrency(saldo)}</div>
  </div>

  <div class="line"></div>

  <div>
    <div>Entrega est.:</div>
    <div class="bold">${order.deliveryDate ? formatDate(order.deliveryDate).split(' ')[0] : 'Por confirmar'}</div>
  </div>

  <div class="center" style="margin-top: 10px;">Gracias por su confianza</div>
  <div class="center separator">==============================</div>
</body>
</html>`;
};

/**
 * Genera HTML para comprobante de entrega (orden completada)
 * @param {string} copyInfo - Información de la copia (ej: "COPIA CLIENTE", "COPIA NEGOCIO")
 */
export const formatDeliveryTicketHTML = (order, businessInfo, copyInfo = null) => {
  // Calcular pago en entrega
  const pagoEntrega = (order.totalPrice || 0) - (order.advancePayment || 0);

  // Obtener método de pago legible
  const paymentMethodMap = {
    'cash': 'Efectivo',
    'card': 'Tarjeta',
    'transfer': 'Transferencia',
    'pending': 'Pendiente'
  };
  const paymentMethod = paymentMethodMap[order.paymentMethod] || order.paymentMethod || 'No especificado';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprobante de Entrega #${order.orderNumber || ''}</title>
  <style>
    @page {
      margin: 0;
      size: 58mm auto;
    }

    body {
      width: 58mm;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      margin: 0;
      padding: 5mm;
      line-height: 1.3;
    }

    .center {
      text-align: center;
    }

    .bold {
      font-weight: bold;
    }

    .large {
      font-size: 12pt;
    }

    .line {
      border-top: 1px dashed #000;
      margin: 5px 0;
    }

    .separator {
      text-align: center;
      margin: 5px 0;
    }

    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="center separator">==============================</div>
  ${copyInfo ? `<div class="center bold" style="margin: 5px 0;">========= ${copyInfo} =========</div>` : ''}
  <div class="center bold large">${businessInfo.businessName || 'CLEAN MASTER SHOES'}</div>
  <div class="center">Tel: ${businessInfo.phone || ''}</div>
  <div class="center separator">==============================</div>

  <div class="center bold large" style="margin: 10px 0;">═══ COMPROBANTE DE ENTREGA ═══</div>

  <div>
    <div>Orden #: ${order.orderNumber || ''}</div>
    <div>Fecha entrega: ${formatDate(order.completedDate || order.createdAt)}</div>
    <div>Cliente: ${order.client || ''}</div>
  </div>

  <div class="line"></div>

  <div>
    ${order.subtotal && order.subtotal > order.totalPrice ? `<div>Subtotal: ${'.'.repeat(13)} ${formatCurrency(order.subtotal)}</div>` : ''}
    ${order.totalDiscount && order.totalDiscount > 0 ? `<div>Descuento: ${'.'.repeat(12)} -${formatCurrency(order.totalDiscount)}</div>` : ''}
    <div class="bold">Total: ${'.'.repeat(16)} ${formatCurrency(order.totalPrice)}</div>
    <div>Anticipo: ${'.'.repeat(13)} ${formatCurrency(order.advancePayment)}</div>
    <div class="bold">Pago entrega: ${'.'.repeat(9)} ${formatCurrency(pagoEntrega)}</div>
    <div>Método: ${paymentMethod}</div>
  </div>

  <div class="line"></div>

  <div class="center bold large">✓ ORDEN COMPLETADA</div>

  <div class="center" style="margin-top: 10px;">¡Gracias por su preferencia!</div>
  <div class="center">¡Esperamos verle pronto!</div>
  <div class="center separator">==============================</div>
</body>
</html>`;
};


// ============================================================================
// FORMATO ESC/POS PARA IMPRESORAS TÉRMICAS BLUETOOTH
// ============================================================================

/**
 * Genera comandos ESC/POS para ticket de recepción
 * Compatible con impresora térmica 58mm
 * @param {string} copyInfo - Información de la copia (ej: "COPIA CLIENTE", "COPIA NEGOCIO")
 */
export const formatReceiptTicketESCPOS = (order, businessInfo, copyInfo = null) => {
  const cmd = createESCPOS();
  const saldo = (order.totalPrice || 0) - (order.advancePayment || 0);

  // Inicializar impresora
  cmd.init();

  // Identificador de copia (si aplica)
  if (copyInfo) {
    cmd
      .align('center')
      .bold(true)
      .text(`===== ${copyInfo} =====`)
      .feed()
      .bold(false);
  }

  // Header - Nombre del negocio
  cmd
    .align('center')
    .bold(true)
    .size(1, 2)
    .text(businessInfo.businessName || 'CLEAN MASTER SHOES')
    .feed()
    .size(1, 1)
    .bold(false);

  // Información de contacto
  if (businessInfo.phone) {
    cmd.text(`Tel: ${businessInfo.phone}`).feed();
  }
  if (businessInfo.address) {
    cmd.text(businessInfo.address).feed();
  }

  cmd.hr('-', 32).emptyLine();

  // Título del ticket
  cmd
    .align('center')
    .bold(true)
    .size(1, 2)
    .text('ORDEN RECIBIDA')
    .feed()
    .size(1, 1)
    .bold(false)
    .align('left')
    .emptyLine();

  // Información de la orden
  cmd
    .keyValue('Orden #', order.orderNumber || 'N/A', 32)
    .keyValue('Fecha', formatDate(order.createdAt, true), 42)
    .keyValue('Cliente', order.client || 'N/A', 32)
    .keyValue('Tel', order.phone || 'N/A', 32)
    .emptyLine();

  cmd.hr('-', 32);

  // Detalle de items
  cmd.bold(true).text('DETALLE:').feed().bold(false);

  // Services (agrupar por nombre)
  if (order.services && order.services.length > 0) {
    // Agrupar servicios por nombre
    const grouped = {};
    order.services.forEach(service => {
      const serviceName = service.serviceName || 'Servicio';
      if (!grouped[serviceName]) {
        grouped[serviceName] = {
          serviceName: serviceName,
          price: service.price || 0,
          quantity: 0
        };
      }
      grouped[serviceName].quantity++;
    });

    // Renderizar servicios agrupados
    Object.values(grouped).forEach(service => {
      const name = service.serviceName;
      const qty = service.quantity;
      const totalPrice = formatCurrency(service.price * service.quantity);
      cmd.tableRow(`${name} x${qty}`, totalPrice, 42);
    });
  }

  // Products
  if (order.products && order.products.length > 0) {
    order.products.forEach(product => {
      const name = product.name || 'Producto';
      const qty = product.quantity || 1;
      const price = formatCurrency(product.salePrice || 0);
      cmd.tableRow(`${name} x${qty}`, price, 42);
    });
  }

  // ShoePairs
  if (order.shoePairs && order.shoePairs.length > 0) {
    order.shoePairs.forEach(pair => {
      const name = `${pair.model || 'Zapato'}-${pair.service || 'Servicio'}`;
      const qty = pair.quantity || 1;
      const price = formatCurrency(pair.price || 0);
      cmd.tableRow(`${name} x${qty}`, price, 42);
    });
  }

  // OtherItems
  if (order.otherItems && order.otherItems.length > 0) {
    order.otherItems.forEach(item => {
      const name = item.description || 'Item';
      const qty = item.quantity || 1;
      const price = formatCurrency(item.price || 0);
      cmd.tableRow(`${name} x${qty}`, price, 42);
    });
  }

  cmd.hr('-', 32);

  // Totales
  cmd
    .tableRow('Subtotal:', formatCurrency(order.subtotal || order.totalPrice), 32);

  // Mostrar descuento si aplica
  if (order.totalDiscount && order.totalDiscount > 0) {
    cmd.tableRow('Descuento:', `-${formatCurrency(order.totalDiscount)}`, 32);
  }

  cmd
    .bold(true)
    .tableRow('TOTAL:', formatCurrency(order.totalPrice), 32)
    .bold(false)
    .tableRow('Anticipo:', formatCurrency(order.advancePayment), 32)
    .bold(true)
    .tableRow('SALDO:', formatCurrency(saldo), 32)
    .bold(false);

  cmd.hr('-', 32);

  // Fecha de entrega
  cmd
    .text('Entrega est.:')
    .feed()
    .bold(true)
    .text(order.deliveryDate ? formatDate(order.deliveryDate).split(' ')[0] : 'Por confirmar')
    .feed()
    .bold(false)
    .emptyLine();

  // QR Code con URL del sitio web
  const websiteUrl = businessInfo.website || 'https://cleanmastershoes.com';
  cmd
    .align('center')
    .emptyLine()
    .qrCode(websiteUrl, 1, 6) // Error correction M, module size 6
    .feed(2)
    .text('Visitanos en nuestro sitio web!')
    .feed()
    .emptyLine();

  // Despedida
  cmd
    .text('Gracias por su confianza')
    .feed(2);

  cmd.hr('=', 32);

  // Abrir cajón si el pago es en efectivo
  if (order.paymentMethod === 'cash') {
    cmd.openDrawer(0, 120, 240); // Pin 2, 240ms ON, 480ms OFF
  }

  // Corte de papel
  cmd.feed(2).cut();

  return cmd.getBytes();
};

/**
 * Genera comandos ESC/POS para comprobante de entrega
 * Compatible con impresora térmica 58mm
 * @param {string} copyInfo - Información de la copia (ej: "COPIA CLIENTE", "COPIA NEGOCIO")
 */
export const formatDeliveryTicketESCPOS = (order, businessInfo, copyInfo = null) => {
  const cmd = createESCPOS();
  const pagoEntrega = (order.totalPrice || 0) - (order.advancePayment || 0);

  const paymentMethodMap = {
    'cash': 'Efectivo',
    'card': 'Tarjeta',
    'transfer': 'Transferencia',
    'pending': 'Pendiente'
  };
  const paymentMethod = paymentMethodMap[order.paymentMethod] || order.paymentMethod || 'N/A';

  // Inicializar impresora
  cmd.init();

  // Identificador de copia (si aplica)
  if (copyInfo) {
    cmd
      .align('center')
      .bold(true)
      .text(`===== ${copyInfo} =====`)
      .feed()
      .bold(false);
  }

  // Header - Nombre del negocio
  cmd
    .align('center')
    .bold(true)
    .size(1, 2)
    .text(businessInfo.businessName || 'CLEAN MASTER SHOES')
    .feed()
    .size(1, 1)
    .bold(false);

  // Información de contacto
  if (businessInfo.phone) {
    cmd.text(`Tel: ${businessInfo.phone}`).feed();
  }

  cmd.hr('-', 32).emptyLine();

  // Título del ticket
  cmd
    .align('center')
    .bold(true)
    .size(1, 2)
    .text('COMPROBANTE DE ENTREGA')
    .feed()
    .size(1, 1)
    .bold(false)
    .align('left')
    .emptyLine();

  // Información de la orden
  cmd
    .keyValue('Orden #', order.orderNumber || 'N/A', 32)
    .keyValue('Fecha', formatDate(order.completedDate || order.createdAt), 32)
    .keyValue('Cliente', order.client || 'N/A', 32)
    .emptyLine();

  cmd.hr('-', 32);

  // Totales y pago
  // Mostrar subtotal y descuento si aplica
  if (order.subtotal && order.subtotal > order.totalPrice) {
    cmd.tableRow('Subtotal:', formatCurrency(order.subtotal), 32);
  }
  if (order.totalDiscount && order.totalDiscount > 0) {
    cmd.tableRow('Descuento:', `-${formatCurrency(order.totalDiscount)}`, 32);
  }

  cmd
    .bold(true)
    .tableRow('Total:', formatCurrency(order.totalPrice), 32)
    .bold(false)
    .tableRow('Anticipo:', formatCurrency(order.advancePayment), 32)
    .bold(true)
    .tableRow('Pago entrega:', formatCurrency(pagoEntrega), 32)
    .bold(false)
    .tableRow('Metodo:', paymentMethod, 32);

  cmd.hr('-', 32).emptyLine();

  // Estado completado
  cmd
    .align('center')
    .bold(true)
    .size(2, 2)
    .text('ORDEN COMPLETADA')
    .feed()
    .size(1, 1)
    .bold(false)
    .emptyLine();

  // QR Code con URL del sitio web
  const websiteUrl = businessInfo.website || 'https://cleanmastershoes.com';
  cmd
    .qrCode(websiteUrl, 1, 6) // Error correction M, module size 6
    .feed(2)
    .text('Visitanos en nuestro sitio web!')
    .feed()
    .emptyLine();

  // Despedida
  cmd
    .text('Gracias por su preferencia')
    .feed()
    .text('Esperamos verle pronto')
    .feed(2);

  cmd.hr('=', 32);

  // Abrir cajón si el pago es en efectivo
  if (order.paymentMethod === 'cash') {
    cmd.openDrawer(0, 120, 240); // Pin 2, 240ms ON, 480ms OFF
  }

  // Corte de papel
  cmd.feed(2).cut();

  return cmd.getBytes();
};

/**
 * Genera HTML para ticket de venta (inventario)
 * @param {string} copyInfo - Información de la copia (ej: "COPIA CLIENTE", "COPIA NEGOCIO")
 */
export const formatSalesTicketHTML = (sale, businessInfo, copyInfo = null) => {
  // Construir lista de items
  let itemsHTML = '';

  // Products
  if (sale.items && sale.items.length > 0) {
    sale.items.forEach(item => {
      const name = item.name || 'Producto';
      const qty = item.quantity || 1;
      const price = item.salePrice || 0;
      const totalPrice = price * qty;
      const dots = '.'.repeat(Math.max(1, 28 - name.length - qty.toString().length - 3 - formatCurrency(totalPrice).length));
      itemsHTML += `    <div>• ${name} x${qty} ${dots} ${formatCurrency(totalPrice)}</div>\n`;
    });
  }

  const paymentMethodMap = {
    'cash': 'Efectivo',
    'card': 'Tarjeta',
    'transfer': 'Transferencia'
  };
  const paymentMethod = paymentMethodMap[sale.paymentMethod] || sale.paymentMethod || 'No especificado';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket de Venta</title>
  <style>
    @page {
      margin: 0;
      size: 58mm auto;
    }

    body {
      width: 58mm;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      margin: 0;
      padding: 5mm;
      line-height: 1.3;
    }

    .center {
      text-align: center;
    }

    .bold {
      font-weight: bold;
    }

    .large {
      font-size: 12pt;
    }

    .line {
      border-top: 1px dashed #000;
      margin: 5px 0;
    }

    .separator {
      text-align: center;
      margin: 5px 0;
    }

    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="center separator">==============================</div>
  ${copyInfo ? `<div class="center bold" style="margin: 5px 0;">========= ${copyInfo} =========</div>` : ''}
  <div class="center bold large">${businessInfo.businessName || 'CLEAN MASTER SHOES'}</div>
  <div class="center">Tel: ${businessInfo.phone || ''}</div>
  <div class="center">${businessInfo.address || ''}</div>
  <div class="center separator">==============================</div>

  <div class="center bold large" style="margin: 10px 0;">═══ TICKET DE VENTA ═══</div>

  <div>
    <div>Fecha: ${formatDate(sale.createdAt, true)}</div>
    ${sale.clientName ? `<div>Cliente: ${sale.clientName}</div>` : ''}
  </div>

  <div class="line"></div>

  <div class="bold">DETALLE:</div>
${itemsHTML}

  <div class="line"></div>

  <div>
    <div>Subtotal: ${'.'.repeat(13)} ${formatCurrency(sale.subtotal)}</div>
    ${sale.discountAmount && sale.discountAmount > 0 ? `<div>Descuento: ${'.'.repeat(12)} -${formatCurrency(sale.discountAmount)}</div>` : ''}
    <div class="bold">TOTAL: ${'.'.repeat(16)} ${formatCurrency(sale.total)}</div>
    <div>Método: ${paymentMethod}</div>
  </div>

  <div class="line"></div>

  <div class="center bold large">✓ VENTA COMPLETADA</div>

  <div class="center" style="margin-top: 10px;">¡Gracias por su compra!</div>
  <div class="center">¡Esperamos verle pronto!</div>
  <div class="center separator">==============================</div>
</body>
</html>`;
};

/**
 * Genera comandos ESC/POS para ticket de venta (inventario)
 * Compatible con impresora térmica 58mm
 * @param {string} copyInfo - Información de la copia (ej: "COPIA CLIENTE", "COPIA NEGOCIO")
 */
export const formatSalesTicketESCPOS = (sale, businessInfo, copyInfo = null) => {
  const cmd = createESCPOS();

  const paymentMethodMap = {
    'cash': 'Efectivo',
    'card': 'Tarjeta',
    'transfer': 'Transferencia'
  };
  const paymentMethod = paymentMethodMap[sale.paymentMethod] || sale.paymentMethod || 'N/A';

  // Inicializar impresora
  cmd.init();

  // Identificador de copia (si aplica)
  if (copyInfo) {
    cmd
      .align('center')
      .bold(true)
      .text(`===== ${copyInfo} =====`)
      .feed()
      .bold(false);
  }

  // Header - Nombre del negocio
  cmd
    .align('center')
    .bold(true)
    .size(1, 2)
    .text(businessInfo.businessName || 'CLEAN MASTER SHOES')
    .feed()
    .size(1, 1)
    .bold(false);

  // Información de contacto
  if (businessInfo.phone) {
    cmd.text(`Tel: ${businessInfo.phone}`).feed();
  }
  if (businessInfo.address) {
    cmd.text(businessInfo.address).feed();
  }

  cmd.hr('-', 32).emptyLine();

  // Título del ticket
  cmd
    .align('center')
    .bold(true)
    .size(1, 2)
    .text('TICKET DE VENTA')
    .feed()
    .size(1, 1)
    .bold(false)
    .align('left')
    .emptyLine();

  // Información de la venta
  cmd
    .keyValue('Fecha', formatDate(sale.createdAt, true), 32);

  if (sale.clientName) {
    cmd.keyValue('Cliente', sale.clientName, 32);
  }

  cmd.emptyLine();

  cmd.hr('-', 32);

  // Detalle de items
  cmd.bold(true).text('DETALLE:').feed().bold(false);

  // Products
  if (sale.items && sale.items.length > 0) {
    sale.items.forEach(item => {
      const name = item.name || 'Producto';
      const qty = item.quantity || 1;
      const price = formatCurrency((item.salePrice || 0) * qty);
      cmd.tableRow(`${name} x${qty}`, price, 42);
    });
  }

  cmd.hr('-', 32);

  // Totales
  cmd
    .tableRow('Subtotal:', formatCurrency(sale.subtotal), 32);

  // Mostrar descuento si aplica
  if (sale.discountAmount && sale.discountAmount > 0) {
    cmd.tableRow('Descuento:', `-${formatCurrency(sale.discountAmount)}`, 32);
  }

  cmd
    .bold(true)
    .tableRow('TOTAL:', formatCurrency(sale.total), 32)
    .bold(false)
    .tableRow('Metodo:', paymentMethod, 32);

  cmd.hr('-', 32).emptyLine();

  // Estado completado
  cmd
    .align('center')
    .bold(true)
    .size(2, 2)
    .text('VENTA COMPLETADA')
    .feed()
    .size(1, 1)
    .bold(false)
    .emptyLine();

  // QR Code con URL del sitio web
  const websiteUrl = businessInfo.website || 'https://cleanmastershoes.com';
  cmd
    .qrCode(websiteUrl, 1, 6) // Error correction M, module size 6
    .feed(2)
    .text('Visitanos en nuestro sitio web!')
    .feed()
    .emptyLine();

  // Despedida
  cmd
    .text('Gracias por su compra')
    .feed()
    .text('Esperamos verle pronto')
    .feed(2);

  cmd.hr('=', 32);

  // Abrir cajón si el pago es en efectivo
  if (sale.paymentMethod === 'cash') {
    cmd.openDrawer(0, 120, 240); // Pin 2, 240ms ON, 480ms OFF
  }

  // Corte de papel
  cmd.feed(2).cut();

  return cmd.getBytes();
};
