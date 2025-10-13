import { useState } from 'react';
import ImageUpload from './ImageUpload';
import './OrderDetailView.css';

const OrderDetailView = ({ order, onClose, onSave, onCancel, onEmail, onWhatsApp, onInvoice }) => {
  const [additionalServices, setAdditionalServices] = useState(order.additionalServices || []);
  const [showServiceSelector, setShowServiceSelector] = useState(false);

  const availableServices = [
    { id: 1, name: 'Lavado Básico', duration: '2-3 días', price: 150, daysToAdd: 2 },
    { id: 2, name: 'Lavado Profundo', duration: '3-5 días', price: 250, daysToAdd: 4 },
    { id: 3, name: 'Restauración', duration: '5-7 días', price: 400, daysToAdd: 6 },
    { id: 4, name: 'Lavado Express', duration: '1 día', price: 100, daysToAdd: 1 }
  ];

  const handleAddService = (service) => {
    const newService = {
      id: Date.now(),
      ...service
    };

    const updatedServices = [...additionalServices, newService];
    setAdditionalServices(updatedServices);
    setShowServiceSelector(false);

    // Calculate new delivery date based on longest service
    const allServices = [
      { daysToAdd: getDaysFromDuration(order.service) },
      ...updatedServices
    ];
    const maxDays = Math.max(...allServices.map(s => s.daysToAdd || 0));

    const today = new Date();
    today.setDate(today.getDate() + maxDays);
    const newDeliveryDate = 'Entrega: ' + today.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    // Calculate new total price
    const additionalTotal = updatedServices.reduce((sum, s) => sum + s.price, 0);
    const newTotal = parseInt(order.price) + additionalTotal;

    // Update order
    const updatedOrder = {
      ...order,
      additionalServices: updatedServices,
      deliveryDate: newDeliveryDate,
      totalPrice: newTotal
    };

    onSave(updatedOrder);
  };

  const handleRemoveService = (serviceId) => {
    const updatedServices = additionalServices.filter(s => s.id !== serviceId);
    setAdditionalServices(updatedServices);

    // Recalculate totals
    const additionalTotal = updatedServices.reduce((sum, s) => sum + s.price, 0);
    const newTotal = parseInt(order.price) + additionalTotal;

    const updatedOrder = {
      ...order,
      additionalServices: updatedServices,
      totalPrice: newTotal
    };

    onSave(updatedOrder);
  };

  const getDaysFromDuration = (serviceName) => {
    const serviceMap = {
      'Lavado Básico': 2,
      'Lavado Profundo': 4,
      'Restauración Completa': 6,
      'Lavado Express': 1,
      'Restauración': 6
    };
    return serviceMap[serviceName] || 3;
  };

  const calculateTotal = () => {
    const basePrice = parseInt(order.price) || 0;
    const additionalTotal = additionalServices.reduce((sum, s) => sum + s.price, 0);
    return basePrice + additionalTotal;
  };

  return (
    <div className="order-detail-view">
      {/* Header con fotos */}
      <div className="order-detail-header">
        <div className="order-detail-photos">
          <ImageUpload images={order.images} onChange={() => {}} />
        </div>
      </div>

      {/* Información de la orden */}
      <div className="order-detail-content">
        {/* Cliente */}
        <div className="detail-section">
          <h3 className="detail-section-title">👤 Información del Cliente</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label className="detail-label">Cliente</label>
              <div className="detail-value">{order.client}</div>
            </div>
            <div className="detail-item">
              <label className="detail-label">Teléfono</label>
              <div className="detail-value">{order.phone}</div>
            </div>
          </div>
        </div>

        {/* Servicio Principal */}
        <div className="detail-section">
          <h3 className="detail-section-title">👟 Servicio Principal</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label className="detail-label">Modelo</label>
              <div className="detail-value">{order.model}</div>
            </div>
            <div className="detail-item">
              <label className="detail-label">Servicio</label>
              <div className="detail-value">{order.service}</div>
            </div>
            <div className="detail-item">
              <label className="detail-label">Precio</label>
              <div className="detail-value price">${order.price}</div>
            </div>
            <div className="detail-item">
              <label className="detail-label">Fecha de Entrega</label>
              <div className="detail-value">{order.deliveryDate}</div>
            </div>
          </div>
        </div>

        {/* Servicios Adicionales */}
        {additionalServices.map((service, index) => (
          <div key={service.id} className="detail-section additional-service">
            <div className="section-header-with-remove">
              <h3 className="detail-section-title">➕ Servicio Adicional #{index + 1}</h3>
              <button
                className="remove-service-btn"
                onClick={() => handleRemoveService(service.id)}
              >
                ✕ Quitar
              </button>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <label className="detail-label">Servicio</label>
                <div className="detail-value">{service.name}</div>
              </div>
              <div className="detail-item">
                <label className="detail-label">Duración</label>
                <div className="detail-value">{service.duration}</div>
              </div>
              <div className="detail-item">
                <label className="detail-label">Precio</label>
                <div className="detail-value price">${service.price}</div>
              </div>
            </div>
          </div>
        ))}

        {/* Selector de Servicio */}
        {showServiceSelector && (
          <div className="detail-section service-selector">
            <h3 className="detail-section-title">Selecciona un Servicio Adicional</h3>
            <div className="service-options">
              {availableServices.map((service) => (
                <div
                  key={service.id}
                  className="service-option"
                  onClick={() => handleAddService(service)}
                >
                  <div className="service-option-header">
                    <span className="service-option-name">{service.name}</span>
                    <span className="service-option-price">${service.price}</span>
                  </div>
                  <div className="service-option-duration">⏱️ {service.duration}</div>
                </div>
              ))}
            </div>
            <button
              className="cancel-selector-btn"
              onClick={() => setShowServiceSelector(false)}
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Total */}
        {additionalServices.length > 0 && (
          <div className="detail-section total-section">
            <div className="total-row">
              <span className="total-label">Total a Cobrar:</span>
              <span className="total-value">${calculateTotal()}</span>
            </div>
          </div>
        )}

        {/* Notas */}
        {order.notes && (
          <div className="detail-section">
            <h3 className="detail-section-title">📝 Notas</h3>
            <div className="detail-notes">{order.notes}</div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="order-detail-actions">
        <button
          className="action-btn btn-add-service"
          onClick={() => setShowServiceSelector(true)}
        >
          ➕ Agregar Servicio
        </button>
        <button className="action-btn btn-charge" onClick={() => onSave({ ...order, additionalServices })}>
          💰 Cobrar
        </button>
        <button className="action-btn btn-email" onClick={() => onEmail(order)}>
          📧 Enviar Correo
        </button>
        <button className="action-btn btn-whatsapp" onClick={() => onWhatsApp(order)}>
          💬 WhatsApp
        </button>
        <button className="action-btn btn-invoice" onClick={() => onInvoice(order)}>
          🧾 Generar Factura
        </button>
        <button className="action-btn btn-cancel-order" onClick={() => onCancel(order)}>
          🗑️ Cancelar Orden
        </button>
      </div>
    </div>
  );
};

export default OrderDetailView;
