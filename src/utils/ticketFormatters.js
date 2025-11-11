/**
 * Formateadores de Tickets para Clean Master Shoes
 * Genera tickets de recepción y entrega en formato HTML y texto plano
 */

import { createESCPOS } from './escposCommands.js';

// ===== HELPERS =====

/**
 * Formatear fecha ISO a formato legible: DD/MM/YYYY HH:mm AM/PM
 */
export const formatDate = (isoString) => {
  if (!isoString) return '';

  const date = new Date(isoString);

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
 */
export const formatReceiptTicketHTML = (order, businessInfo) => {
  // Calcular saldo pendiente
  const saldo = (order.totalPrice || 0) - (order.advancePayment || 0);

  // Construir lista de items
  let itemsHTML = '';

  // Services
  if (order.services && order.services.length > 0) {
    order.services.forEach(service => {
      const name = service.serviceName || 'Servicio';
      const qty = service.quantity || 1;
      const price = service.price || 0;
      const dots = '.'.repeat(Math.max(1, 32 - name.length - qty.toString().length - 3 - formatCurrency(price).length));
      itemsHTML += `    <div>• ${name} x${qty} ${dots} ${formatCurrency(price)}</div>\n`;
    });
  }

  // Products
  if (order.products && order.products.length > 0) {
    order.products.forEach(product => {
      const name = product.name || 'Producto';
      const qty = product.quantity || 1;
      const price = product.salePrice || 0;
      const dots = '.'.repeat(Math.max(1, 32 - name.length - qty.toString().length - 3 - formatCurrency(price).length));
      itemsHTML += `    <div>• ${name} x${qty} ${dots} ${formatCurrency(price)}</div>\n`;
    });
  }

  // ShoePairs
  if (order.shoePairs && order.shoePairs.length > 0) {
    order.shoePairs.forEach(pair => {
      const name = `${pair.model || 'Zapato'} - ${pair.service || 'Servicio'}`;
      const qty = pair.quantity || 1;
      const price = pair.price || 0;
      const dots = '.'.repeat(Math.max(1, 32 - name.length - qty.toString().length - 3 - formatCurrency(price).length));
      itemsHTML += `    <div>• ${name} x${qty} ${dots} ${formatCurrency(price)}</div>\n`;
    });
  }

  // OtherItems
  if (order.otherItems && order.otherItems.length > 0) {
    order.otherItems.forEach(item => {
      const name = item.description || 'Item';
      const qty = item.quantity || 1;
      const price = item.price || 0;
      const dots = '.'.repeat(Math.max(1, 32 - name.length - qty.toString().length - 3 - formatCurrency(price).length));
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
  <div class="center separator">================================</div>
  <div class="center bold large">${businessInfo.businessName || 'CLEAN MASTER SHOES'}</div>
  <div class="center">Tel: ${businessInfo.phone || ''}</div>
  <div class="center">${businessInfo.address || ''}</div>
  <div class="center separator">================================</div>

  <div class="center bold large" style="margin: 10px 0;">═══ ORDEN RECIBIDA ═══</div>

  <div>
    <div>Orden #: ${order.orderNumber || ''}</div>
    <div>Fecha: ${formatDate(order.createdAt)}</div>
    <div>Cliente: ${order.client || ''}</div>
    <div>Tel: ${order.phone || ''}</div>
  </div>

  <div class="line"></div>

  <div class="bold">DETALLE:</div>
${itemsHTML}

  <div class="line"></div>

  <div>
    <div>Subtotal: ${'.'.repeat(16)} ${formatCurrency(order.totalPrice)}</div>
    <div class="bold">TOTAL: ${'.'.repeat(19)} ${formatCurrency(order.totalPrice)}</div>
    <div>Anticipo pagado: ${'.'.repeat(9)} ${formatCurrency(order.advancePayment)}</div>
    <div class="bold">SALDO PENDIENTE: ${'.'.repeat(9)} ${formatCurrency(saldo)}</div>
  </div>

  <div class="line"></div>

  <div>
    <div>Fecha entrega estimada:</div>
    <div class="bold">${order.deliveryDate ? formatDate(order.deliveryDate).split(' ')[0] : 'Por confirmar'}</div>
  </div>

  <div class="center" style="margin-top: 10px;">Gracias por su confianza</div>
  <div class="center separator">================================</div>
</body>
</html>`;
};

/**
 * Genera HTML para comprobante de entrega (orden completada)
 */
export const formatDeliveryTicketHTML = (order, businessInfo) => {
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
  <div class="center separator">================================</div>
  <div class="center bold large">${businessInfo.businessName || 'CLEAN MASTER SHOES'}</div>
  <div class="center">Tel: ${businessInfo.phone || ''}</div>
  <div class="center separator">================================</div>

  <div class="center bold large" style="margin: 10px 0;">═══ COMPROBANTE DE ENTREGA ═══</div>

  <div>
    <div>Orden #: ${order.orderNumber || ''}</div>
    <div>Fecha entrega: ${formatDate(order.completedDate || order.createdAt)}</div>
    <div>Cliente: ${order.client || ''}</div>
  </div>

  <div class="line"></div>

  <div>
    <div>Total orden: ${'.'.repeat(15)} ${formatCurrency(order.totalPrice)}</div>
    <div>Anticipo previo: ${'.'.repeat(11)} ${formatCurrency(order.advancePayment)}</div>
    <div class="bold">Pago en entrega: ${'.'.repeat(9)} ${formatCurrency(pagoEntrega)}</div>
    <div>Método: ${paymentMethod}</div>
  </div>

  <div class="line"></div>

  <div class="center bold large">✓ ORDEN COMPLETADA</div>

  <div class="center" style="margin-top: 10px;">¡Gracias por su preferencia!</div>
  <div class="center">¡Esperamos verle pronto!</div>
  <div class="center separator">================================</div>
</body>
</html>`;
};

// ===== FORMATEADORES TEXTO PLANO =====

/**
 * Versión en texto plano del ticket de recepción para Share API
 */
export const formatReceiptTicketText = (order, businessInfo) => {
  const saldo = (order.totalPrice || 0) - (order.advancePayment || 0);

  let text = '';
  text += '================================\n';
  text += `     ${businessInfo.businessName || 'CLEAN MASTER SHOES'}\n`;
  text += `       Tel: ${businessInfo.phone || ''}\n`;
  text += `    ${businessInfo.address || ''}\n`;
  text += '================================\n\n';
  text += '═══ ORDEN RECIBIDA ═══\n\n';
  text += `Orden #: ${order.orderNumber || ''}\n`;
  text += `Fecha: ${formatDate(order.createdAt)}\n`;
  text += `Cliente: ${order.client || ''}\n`;
  text += `Tel: ${order.phone || ''}\n\n`;
  text += '--------------------------------\n';
  text += 'DETALLE:\n';

  // Services
  if (order.services && order.services.length > 0) {
    order.services.forEach(service => {
      const name = service.serviceName || 'Servicio';
      const qty = service.quantity || 1;
      const price = formatCurrency(service.price || 0);
      text += `• ${name} x${qty} .. ${price}\n`;
    });
  }

  // Products
  if (order.products && order.products.length > 0) {
    order.products.forEach(product => {
      const name = product.name || 'Producto';
      const qty = product.quantity || 1;
      const price = formatCurrency(product.salePrice || 0);
      text += `• ${name} x${qty} .. ${price}\n`;
    });
  }

  // ShoePairs
  if (order.shoePairs && order.shoePairs.length > 0) {
    order.shoePairs.forEach(pair => {
      const name = `${pair.model || 'Zapato'} - ${pair.service || 'Servicio'}`;
      const qty = pair.quantity || 1;
      const price = formatCurrency(pair.price || 0);
      text += `• ${name} x${qty} .. ${price}\n`;
    });
  }

  // OtherItems
  if (order.otherItems && order.otherItems.length > 0) {
    order.otherItems.forEach(item => {
      const name = item.description || 'Item';
      const qty = item.quantity || 1;
      const price = formatCurrency(item.price || 0);
      text += `• ${name} x${qty} .. ${price}\n`;
    });
  }

  text += '--------------------------------\n\n';
  text += `Subtotal: .............. ${formatCurrency(order.totalPrice)}\n`;
  text += `TOTAL: ................. ${formatCurrency(order.totalPrice)}\n`;
  text += `Anticipo pagado: ....... ${formatCurrency(order.advancePayment)}\n`;
  text += `SALDO PENDIENTE: ....... ${formatCurrency(saldo)}\n\n`;
  text += '--------------------------------\n';
  text += 'Fecha entrega estimada:\n';
  text += `${order.deliveryDate ? formatDate(order.deliveryDate).split(' ')[0] : 'Por confirmar'}\n\n`;
  text += 'Gracias por su confianza\n';
  text += '================================';

  return text;
};

/**
 * Versión en texto plano del comprobante de entrega
 */
export const formatDeliveryTicketText = (order, businessInfo) => {
  const pagoEntrega = (order.totalPrice || 0) - (order.advancePayment || 0);

  const paymentMethodMap = {
    'cash': 'Efectivo',
    'card': 'Tarjeta',
    'transfer': 'Transferencia',
    'pending': 'Pendiente'
  };
  const paymentMethod = paymentMethodMap[order.paymentMethod] || order.paymentMethod || 'No especificado';

  let text = '';
  text += '================================\n';
  text += `     ${businessInfo.businessName || 'CLEAN MASTER SHOES'}\n`;
  text += `       Tel: ${businessInfo.phone || ''}\n`;
  text += '================================\n\n';
  text += '═══ COMPROBANTE DE ENTREGA ═══\n\n';
  text += `Orden #: ${order.orderNumber || ''}\n`;
  text += `Fecha entrega: ${formatDate(order.completedDate || order.createdAt)}\n`;
  text += `Cliente: ${order.client || ''}\n\n`;
  text += '--------------------------------\n';
  text += `Total orden: ............. ${formatCurrency(order.totalPrice)}\n`;
  text += `Anticipo previo: ......... ${formatCurrency(order.advancePayment)}\n`;
  text += `Pago en entrega: ......... ${formatCurrency(pagoEntrega)}\n`;
  text += `Método: ${paymentMethod}\n`;
  text += '--------------------------------\n\n';
  text += '✓ ORDEN COMPLETADA\n\n';
  text += '¡Gracias por su preferencia!\n';
  text += '¡Esperamos verle pronto!\n';
  text += '================================';

  return text;
};

// ============================================================================
// FORMATO ESC/POS PARA IMPRESORAS TÉRMICAS BLUETOOTH
// ============================================================================

/**
 * Genera comandos ESC/POS para ticket de recepción
 * Compatible con impresora térmica 58mm
 */
export const formatReceiptTicketESCPOS = (order, businessInfo) => {
  const cmd = createESCPOS();
  const saldo = (order.totalPrice || 0) - (order.advancePayment || 0);

  // Inicializar impresora
  cmd.init();

  // Header - Nombre del negocio
  cmd
    .align('center')
    .bold(true)
    .size(2, 2)
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

  cmd.hr('-', 48).emptyLine();

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
    .keyValue('Orden #', order.orderNumber || 'N/A')
    .keyValue('Fecha', formatDate(order.createdAt))
    .keyValue('Cliente', order.client || 'N/A')
    .keyValue('Tel', order.phone || 'N/A')
    .emptyLine();

  cmd.hr('-', 48);

  // Detalle de items
  cmd.bold(true).text('DETALLE:').feed().bold(false);

  // Services
  if (order.services && order.services.length > 0) {
    order.services.forEach(service => {
      const name = service.serviceName || 'Servicio';
      const qty = service.quantity || 1;
      const price = formatCurrency(service.price || 0);
      cmd.tableRow(`${name} x${qty}`, price, 48);
    });
  }

  // Products
  if (order.products && order.products.length > 0) {
    order.products.forEach(product => {
      const name = product.name || 'Producto';
      const qty = product.quantity || 1;
      const price = formatCurrency(product.salePrice || 0);
      cmd.tableRow(`${name} x${qty}`, price, 48);
    });
  }

  // ShoePairs
  if (order.shoePairs && order.shoePairs.length > 0) {
    order.shoePairs.forEach(pair => {
      const name = `${pair.model || 'Zapato'}-${pair.service || 'Servicio'}`;
      const qty = pair.quantity || 1;
      const price = formatCurrency(pair.price || 0);
      cmd.tableRow(`${name} x${qty}`, price, 48);
    });
  }

  // OtherItems
  if (order.otherItems && order.otherItems.length > 0) {
    order.otherItems.forEach(item => {
      const name = item.description || 'Item';
      const qty = item.quantity || 1;
      const price = formatCurrency(item.price || 0);
      cmd.tableRow(`${name} x${qty}`, price, 48);
    });
  }

  cmd.hr('-', 48);

  // Totales
  cmd
    .tableRow('Subtotal:', formatCurrency(order.totalPrice), 48)
    .bold(true)
    .tableRow('TOTAL:', formatCurrency(order.totalPrice), 48)
    .bold(false)
    .tableRow('Anticipo pagado:', formatCurrency(order.advancePayment), 48)
    .bold(true)
    .tableRow('SALDO PENDIENTE:', formatCurrency(saldo), 48)
    .bold(false);

  cmd.hr('-', 48);

  // Fecha de entrega
  cmd
    .text('Fecha entrega estimada:')
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
    .text('Escanea para mas info')
    .feed()
    .emptyLine();

  // Despedida
  cmd
    .text('Gracias por su confianza')
    .feed(2);

  cmd.hr('=', 48);

  // Corte de papel
  cmd.feed(2).cut();

  return cmd.getBytes();
};

/**
 * Genera comandos ESC/POS para comprobante de entrega
 * Compatible con impresora térmica 58mm
 */
export const formatDeliveryTicketESCPOS = (order, businessInfo) => {
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

  // Header - Nombre del negocio
  cmd
    .align('center')
    .bold(true)
    .size(2, 2)
    .text(businessInfo.businessName || 'CLEAN MASTER SHOES')
    .feed()
    .size(1, 1)
    .bold(false);

  // Información de contacto
  if (businessInfo.phone) {
    cmd.text(`Tel: ${businessInfo.phone}`).feed();
  }

  cmd.hr('-', 48).emptyLine();

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
    .keyValue('Orden #', order.orderNumber || 'N/A')
    .keyValue('Fecha entrega', formatDate(order.completedDate || order.createdAt))
    .keyValue('Cliente', order.client || 'N/A')
    .emptyLine();

  cmd.hr('-', 48);

  // Totales y pago
  cmd
    .tableRow('Total orden:', formatCurrency(order.totalPrice), 48)
    .tableRow('Anticipo previo:', formatCurrency(order.advancePayment), 48)
    .bold(true)
    .tableRow('Pago en entrega:', formatCurrency(pagoEntrega), 48)
    .bold(false)
    .keyValue('Metodo', paymentMethod);

  cmd.hr('-', 48).emptyLine();

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
    .text('Escanea para mas info')
    .feed()
    .emptyLine();

  // Despedida
  cmd
    .text('Gracias por su preferencia')
    .feed()
    .text('Esperamos verle pronto')
    .feed(2);

  cmd.hr('=', 48);

  // Corte de papel
  cmd.feed(2).cut();

  return cmd.getBytes();
};
