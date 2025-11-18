import jsPDF from 'jspdf';

export const generateInvoicePDF = async (order, businessProfile) => {
  const pdf = new jsPDF('p', 'mm', 'a4');

  // Header con datos del negocio
  pdf.setFillColor(255, 0, 110); // Rosa mexicano
  pdf.rect(0, 0, 210, 40, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont(undefined, 'bold');
  pdf.text(businessProfile.businessName || 'Clean Master Shoes', 15, 20);

  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.text(businessProfile.phone || '', 15, 27);
  pdf.text(businessProfile.address || '', 15, 32);

  // Título FACTURA
  pdf.setFontSize(18);
  pdf.setFont(undefined, 'bold');
  pdf.text('FACTURA', 150, 20);

  // Información de la orden
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');

  let yPos = 50;

  pdf.text(`No. Orden: ${order.orderNumber || order.id.substring(0, 8)}`, 15, yPos);
  pdf.text(`Fecha: ${new Date(order.createdAt).toLocaleDateString('es-MX')}`, 150, yPos);

  yPos += 10;
  pdf.setFont(undefined, 'bold');
  pdf.text('Cliente:', 15, yPos);
  pdf.setFont(undefined, 'normal');
  pdf.text(order.client, 40, yPos);

  yPos += 6;
  pdf.text(`Telefono: ${order.phone || 'N/A'}`, 15, yPos);

  // Tabla de servicios
  yPos += 15;
  pdf.setFont(undefined, 'bold');
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos - 5, 180, 8, 'F');
  pdf.text('Descripcion', 20, yPos);
  pdf.text('Cantidad', 140, yPos);
  pdf.text('Precio', 170, yPos, { align: 'right' });

  yPos += 10;
  pdf.setFont(undefined, 'normal');

  // Servicios (agrupar por nombre)
  if (order.services && order.services.length > 0) {
    // Agrupar servicios por nombre
    const grouped = {};
    order.services.forEach(service => {
      if (service.status !== 'cancelled') {
        const serviceName = service.serviceName || 'Servicio';
        if (!grouped[serviceName]) {
          grouped[serviceName] = {
            serviceName: serviceName,
            price: service.price || 0,
            quantity: 0
          };
        }
        grouped[serviceName].quantity++;
      }
    });

    // Renderizar servicios agrupados
    Object.values(grouped).forEach(service => {
      pdf.text(service.serviceName, 20, yPos);
      pdf.text(service.quantity.toString(), 140, yPos);
      pdf.text(`$${(service.price * service.quantity).toFixed(2)}`, 170, yPos, { align: 'right' });
      yPos += 7;
    });
  }

  // Productos
  if (order.products && order.products.length > 0) {
    order.products.forEach(product => {
      pdf.text(product.name, 20, yPos);
      pdf.text(product.quantity.toString(), 140, yPos);
      pdf.text(`$${(product.salePrice * product.quantity).toFixed(2)}`, 170, yPos, { align: 'right' });
      yPos += 7;
    });
  }

  // Total
  yPos += 10;
  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(14);
  pdf.text('Total:', 140, yPos);
  pdf.text(`$${order.totalPrice.toFixed(2)}`, 170, yPos, { align: 'right' });

  // Información de pago
  yPos += 15;
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Anticipo: $${(order.advancePayment || 0).toFixed(2)}`, 15, yPos);
  yPos += 7;
  pdf.text(`Saldo: $${((order.totalPrice || 0) - (order.advancePayment || 0)).toFixed(2)}`, 15, yPos);
  yPos += 7;
  const paymentStatusText = order.paymentStatus === 'paid' ? 'Pagado' :
                           order.paymentStatus === 'partial' ? 'Parcial' : 'Pendiente';
  pdf.text(`Estado de pago: ${paymentStatusText}`, 15, yPos);

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  pdf.text('Gracias por su preferencia!', 105, 280, { align: 'center' });

  // Establecer nombre descriptivo para el archivo
  const orderNum = order.orderNumber || order.id.substring(0, 8);
  const clientName = order.client.replace(/\s+/g, '_'); // Reemplazar espacios con guiones bajos
  const date = new Date(order.createdAt).toLocaleDateString('es-MX').replace(/\//g, '-');
  const filename = `Factura_${orderNum}_${clientName}_${date}.pdf`;

  pdf.setProperties({
    title: filename
  });

  return pdf;
};
