import { useState, useMemo, useRef, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import { subscribeToEmployees } from '../services/firebaseService';
import './OrderDetailView.css';

const OrderDetailView = ({ order, currentTab, onClose, onSave, onStatusChange, onCancel, onEmail, onWhatsApp, onInvoice, onCobrar, onEntregar }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  // Estado local para gestionar los servicios
  const [localServices, setLocalServices] = useState(order.services || []);

  // Estado local para las imágenes de la orden
  const [orderImages, setOrderImages] = useState(order.orderImages || []);

  // Estado para empleados activos
  const [activeEmployees, setActiveEmployees] = useState([]);

  // Estado para el autor de la orden
  const [orderAuthor, setOrderAuthor] = useState(order.author || '');

  // Sincronizar orderImages cuando cambie la orden
  useEffect(() => {
    setOrderImages(order.orderImages || []);
  }, [order.orderImages]);

  // Cargar empleados activos
  useEffect(() => {
    const unsubscribe = subscribeToEmployees((employees) => {
      const active = employees.filter(emp => emp.status === 'active');
      setActiveEmployees(active);
    });

    return () => unsubscribe();
  }, []);

  // Estado local para gestionar el estado general de la orden
  // Usar currentTab que indica en qué pestaña está la orden actualmente
  const [orderStatus, setOrderStatus] = useState(currentTab || 'recibidos');

  // Estado local para gestionar los datos de pago
  const [paymentData, setPaymentData] = useState({
    advancePayment: parseFloat(order.advancePayment) || 0,
    paymentStatus: order.paymentStatus || 'pending',
    paymentMethod: order.paymentMethod || 'pending'
  });

  // Estado local para la fecha de entrega
  const [localDeliveryDate, setLocalDeliveryDate] = useState(order.deliveryDate);

  // Estado local para las notas generales
  const [generalNotes, setGeneralNotes] = useState(order.generalNotes || '');

  // Referencia al input de fecha
  const dateInputRef = useRef(null);

  // Estados disponibles para cada par
  const pairStatuses = [
    { value: 'pending', label: '⏳ Pendiente', color: '#fbbf24' },
    { value: 'in-progress', label: '🔄 En Proceso', color: '#0096ff' },
    { value: 'completed', label: '✅ Completado', color: '#10b981' },
    { value: 'cancelled', label: '❌ Cancelado', color: '#ef4444' }
  ];

  // Estados disponibles para la orden general (deben coincidir con las pestañas)
  const orderStatuses = [
    { value: 'recibidos', label: '📥 Recibidos' },
    { value: 'proceso', label: '🔧 En Proceso' },
    { value: 'listos', label: '✅ Listos' },
    { value: 'enEntrega', label: '🚚 En Entrega' }
  ];

  // Calcular precio total excluyendo servicios cancelados
  const totalPrice = useMemo(() => {
    return localServices
      .filter(service => service.status !== 'cancelled')
      .reduce((sum, service) => sum + (service.price || 0), 0);
  }, [localServices]);

  const advancePayment = paymentData.advancePayment;
  // Si el estado de pago es 'paid', el restante es 0, sino calcularlo normalmente
  const remainingPayment = paymentData.paymentStatus === 'paid' ? 0 : totalPrice - advancePayment;

  // Determinar si la orden está completamente pagada
  const isFullyPaid = remainingPayment <= 0 || paymentData.paymentStatus === 'paid';

  // Determinar si mostrar botón de Cobrar o Entregar
  const showCobrarButton = currentTab === 'enEntrega' && !isFullyPaid;
  const showEntregarButton = currentTab === 'enEntrega' && isFullyPaid;

  // Métodos de pago
  const getPaymentMethodLabel = (method) => {
    const methods = {
      'cash': '💵 Efectivo',
      'card': '💳 Tarjeta',
      'transfer': '📱 Transferencia',
      'pending': '⏳ Pendiente'
    };
    return methods[method] || '⏳ Pendiente';
  };

  // Abrir modal de imagen
  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  // Cerrar modal de imagen
  const closeImageModal = () => {
    setSelectedImage(null);
  };


  const handleWhatsApp = () => {
    const phone = order.phone.replace(/\D/g, '');
    const message = `Hola ${order.client}, tu orden está lista para recoger. Total: $${totalPrice}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Cambiar estado de un servicio
  const handleServiceStatusChange = (serviceId, newStatus) => {
    const updatedServices = localServices.map(service =>
      service.id === serviceId ? { ...service, status: newStatus } : service
    );

    setLocalServices(updatedServices);

    const updatedOrder = {
      ...order,
      orderStatus: orderStatus,
      services: updatedServices,
      generalNotes: generalNotes,
      orderImages: orderImages,
      author: orderAuthor,
      deliveryDate: localDeliveryDate
    };

    // Llamar a onSave si está disponible
    if (onSave) {
      onSave(updatedOrder);
    }
  };

  // Cambiar imágenes de la orden (a nivel de orden, no de servicio)
  const handleOrderImagesChange = (newImages) => {
    // Actualizar estado local
    setOrderImages(newImages);

    const updatedOrder = {
      ...order,
      orderStatus: orderStatus,
      orderImages: newImages,
      services: localServices,
      generalNotes: generalNotes,
      author: orderAuthor,
      deliveryDate: localDeliveryDate
    };

    // Llamar a onSave si está disponible
    if (onSave) {
      onSave(updatedOrder);
    }
  };

  // Verificar si todos los servicios están completados o cancelados
  const allItemsCompletedOrCancelled = useMemo(() => {
    return localServices.every(service =>
      service.status === 'completed' || service.status === 'cancelled'
    );
  }, [localServices]);

  // Cambiar estado general de la orden
  const handleOrderStatusChange = (newStatus) => {
    // Validar si se intenta cambiar a "enEntrega"
    if (newStatus === 'enEntrega' && !allItemsCompletedOrCancelled) {
      alert('No se puede mover a "En Entrega" hasta que todos los items estén completados o cancelados');
      return;
    }

    setOrderStatus(newStatus);

    // Crear orden actualizada con TODOS los campos actuales
    const updatedOrder = {
      ...order,
      orderStatus: newStatus,
      services: localServices,
      generalNotes: generalNotes,
      orderImages: orderImages,
      author: orderAuthor,
      deliveryDate: localDeliveryDate
    };

    // Primero guardar todos los cambios con onSave
    if (onSave) {
      onSave(updatedOrder);
    }

    // Luego llamar a onStatusChange para mover la orden entre columnas
    if (onStatusChange) {
      onStatusChange(updatedOrder, newStatus);
    }
  };

  // Handler para guardar la fecha de entrega
  const handleSaveDeliveryDate = (newDate) => {
    // Actualizar estado local inmediatamente para refrescar la vista
    setLocalDeliveryDate(newDate);

    const updatedOrder = {
      ...order,
      orderStatus: orderStatus,
      deliveryDate: newDate, // Guardar en formato YYYY-MM-DD
      services: localServices,
      generalNotes: generalNotes,
      orderImages: orderImages,
      author: orderAuthor
    };

    if (onSave) {
      onSave(updatedOrder);
    }
  };

  // Handler para actualizar las notas generales
  const handleGeneralNotesChange = (e) => {
    const newNotes = e.target.value;
    setGeneralNotes(newNotes);

    const updatedOrder = {
      ...order,
      orderStatus: orderStatus,
      generalNotes: newNotes,
      services: localServices,
      orderImages: orderImages,
      author: orderAuthor,
      deliveryDate: localDeliveryDate
    };

    if (onSave) {
      onSave(updatedOrder);
    }
  };

  // Handler para cambiar el autor de la orden
  const handleAuthorChange = (e) => {
    const newAuthor = e.target.value;
    setOrderAuthor(newAuthor);

    const updatedOrder = {
      ...order,
      orderStatus: orderStatus,
      author: newAuthor,
      services: localServices,
      orderImages: orderImages,
      generalNotes: generalNotes,
      deliveryDate: localDeliveryDate
    };

    if (onSave) {
      onSave(updatedOrder);
    }
  };

  // Función para formatear fecha de entrega para mostrar
  const formatDeliveryDateDisplay = (dateString) => {
    // Parsear la fecha como local en lugar de UTC
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Remove time component for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return 'Hoy';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Mañana';
    } else {
      const options = { day: 'numeric', month: 'short', year: 'numeric' };
      return date.toLocaleDateString('es-ES', options);
    }
  };

  // Handler personalizado para cobrar que actualiza el estado local
  const handleCobrar = () => {
    if (onCobrar) {
      onCobrar(order);

      // Actualizar el estado local inmediatamente después de cobrar
      setPaymentData({
        advancePayment: paymentData.advancePayment, // Mantener el anticipo original
        paymentStatus: 'paid',
        paymentMethod: 'cash' // Actualizar a efectivo
      });
    }
  };

  // Obtener el label del estado
  const getStatusLabel = (status) => {
    const statusObj = pairStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : '⏳ Pendiente';
  };

  return (
    <div className="order-detail-view">
      {/* Galería de Imágenes de la Orden */}
      <div className="order-gallery-section">
        <h3 className="section-title">📸 Galería de Imágenes de la Orden</h3>
        <ImageUpload
          images={orderImages}
          onChange={handleOrderImagesChange}
        />
      </div>

      {/* Información de Servicios */}
      <div className="order-pairs-section">
        <h3 className="section-title">🧼 Servicios ({localServices.length})</h3>
        <div className="pairs-grid">
          {localServices.map((service, index) => (
            <div key={service.id || index} className={`pair-detail-card pair-status-${service.status || 'pending'}`}>
              <div className="pair-card-header">
                <div className="pair-header-left">
                  <span className="pair-number">{service.icon} Servicio #{index + 1}</span>
                  <span className={`pair-status-badge status-${service.status || 'pending'}`}>
                    {getStatusLabel(service.status || 'pending')}
                  </span>
                </div>
                <span className="pair-price-badge">${service.price}</span>
              </div>

              <div className="pair-card-body">
                <div className="pair-info-row">
                  <span className="pair-info-label">Servicio:</span>
                  <span className="pair-info-value">{service.serviceName}</span>
                </div>

                {/* Selector de Estado */}
                <div className="pair-status-selector">
                  <span className="pair-info-label">Estado del Servicio:</span>
                  <select
                    className={`pair-status-select status-${service.status || 'pending'}`}
                    value={service.status || 'pending'}
                    onChange={(e) => handleServiceStatusChange(service.id, e.target.value)}
                  >
                    {pairStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {service.notes && (
                  <div className="pair-notes">
                    <span className="pair-info-label">Notas:</span>
                    <p className="pair-notes-text">{service.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información de Pago y Entrega */}
      <div className="order-details-grid">
        {/* Pago */}
        <div className="detail-card">
          <h3 className="detail-card-title">💰 Información de Pago</h3>
          <div className="detail-card-content">
            <div className="detail-row">
              <span className="detail-label">Precio Total:</span>
              <span className="detail-value price-large">${totalPrice}</span>
            </div>
            {advancePayment > 0 && (
              <>
                <div className="detail-row">
                  <span className="detail-label">Anticipo:</span>
                  <span className="detail-value">${advancePayment}</span>
                </div>
                <div className="detail-row highlight">
                  <span className="detail-label">Restante por Cobrar:</span>
                  <span className="detail-value price-highlight">${remainingPayment}</span>
                </div>
              </>
            )}
            <div className="detail-row">
              <span className="detail-label">Método de Pago:</span>
              <span className="detail-value">{getPaymentMethodLabel(paymentData.paymentMethod)}</span>
            </div>
            {isFullyPaid && (
              <div className="detail-row payment-complete">
                <span className="detail-label">Estado de Pago:</span>
                <span className="detail-value payment-status-badge">✅ Pagado Completo</span>
              </div>
            )}
          </div>
        </div>

        {/* Entrega */}
        <div className="detail-card">
          <h3 className="detail-card-title">📅 Información de Entrega</h3>
          <div className="detail-card-content">
            <div className="detail-row">
              <span className="detail-label">Fecha de Entrega:</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
                <span className="detail-value">{formatDeliveryDateDisplay(localDeliveryDate)}</span>
                <div style={{ position: 'relative' }}>
                  <button
                    className="btn-edit-date"
                    style={{
                      padding: '4px 8px',
                      background: 'transparent',
                      border: '1px solid var(--color-gray-700)',
                      borderRadius: '4px',
                      color: 'var(--color-gray-500)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    📅
                  </button>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={localDeliveryDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleSaveDeliveryDate(e.target.value);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                      zIndex: 2
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="detail-row">
              <span className="detail-label">Estado de la Orden:</span>
              <select
                className={`order-status-select status-${orderStatus}`}
                value={orderStatus}
                onChange={(e) => handleOrderStatusChange(e.target.value)}
              >
                {orderStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            {!allItemsCompletedOrCancelled && (
              <div className="detail-row" style={{ marginTop: '8px' }}>
                <span style={{
                  fontSize: '12px',
                  color: '#f59e0b',
                  fontStyle: 'italic'
                }}>
                  ⚠️ Para mover a "En Entrega", todos los servicios deben estar completados o cancelados
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información de la Orden */}
      <div className="order-details-grid">
        <div className="detail-card">
          <h3 className="detail-card-title">📋 Información de la Orden</h3>
          <div className="detail-card-content">
            <div className="detail-row">
              <span className="detail-label">Fecha de Recepción:</span>
              <span className="detail-value">
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'No disponible'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Número de Orden:</span>
              <span className="detail-value">#{order.orderNumber || order.id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Autor de la Orden:</span>
              <select
                className={`author-select ${orderAuthor ? 'has-value' : ''}`}
                value={orderAuthor}
                onChange={handleAuthorChange}
              >
                <option value="">Sin asignar</option>
                {activeEmployees.map(employee => (
                  <option key={employee.id} value={employee.name}>
                    {employee.name} - {employee.role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Notas Generales */}
      <div className="order-details-grid">
        <div className="detail-card">
          <h3 className="detail-card-title">📝 Notas Generales</h3>
          <div className="detail-card-content">
            <textarea
              className="form-input form-textarea"
              placeholder="Escribe notas generales de la orden..."
              rows="4"
              value={generalNotes}
              onChange={handleGeneralNotesChange}
              style={{
                width: '100%',
                resize: 'vertical',
                fontFamily: 'inherit',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--color-gray-800)',
                borderRadius: '10px',
                color: 'var(--color-white)',
                fontSize: '15px',
                lineHeight: '1.6'
              }}
            />
          </div>
        </div>
      </div>

      {/* Botones de Cierre de Orden */}
      {(showCobrarButton || showEntregarButton) && (
        <div className="order-close-section">
          {showCobrarButton && (
            <button
              className="btn-close-order btn-cobrar-large"
              onClick={handleCobrar}
            >
              <span className="btn-close-icon">💳</span>
              <div className="btn-close-content">
                <span className="btn-close-title">Cobrar</span>
                <span className="btn-close-subtitle">Registrar pago de ${remainingPayment}</span>
              </div>
            </button>
          )}

          {showEntregarButton && (
            <button
              className="btn-close-order btn-entregar-large"
              onClick={() => onEntregar && onEntregar(order)}
            >
              <span className="btn-close-icon">📦</span>
              <div className="btn-close-content">
                <span className="btn-close-title">Entregar Orden</span>
                <span className="btn-close-subtitle">Marcar como completada y entregada</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Botones de Acción */}
      <div className="order-actions-footer">
        <div className="action-buttons-grid">
          <button
            className="action-btn btn-whatsapp"
            onClick={handleWhatsApp}
          >
            <span className="action-icon">💬</span>
            <span className="action-text">WhatsApp</span>
          </button>

          <button
            className="action-btn btn-email"
            onClick={() => onEmail && onEmail(order)}
          >
            <span className="action-icon">📧</span>
            <span className="action-text">Enviar Email</span>
          </button>

          <button
            className="action-btn btn-invoice"
            onClick={() => onInvoice && onInvoice(order)}
          >
            <span className="action-icon">🧾</span>
            <span className="action-text">Generar Factura</span>
          </button>

          <button
            className="action-btn btn-cancel"
            onClick={() => onCancel && onCancel(order)}
          >
            <span className="action-icon">🗑️</span>
            <span className="action-text">Cancelar Orden</span>
          </button>
        </div>
      </div>

      {/* Modal de Imagen */}
      {selectedImage && (
        <div className="image-modal" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeImageModal}>
              ✕
            </button>
            <img src={selectedImage} alt="Vista ampliada" className="image-modal-img" />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailView;
