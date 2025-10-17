import { useState, useMemo, useRef } from 'react';
import ImageUpload from './ImageUpload';
import './OrderDetailView.css';

const OrderDetailView = ({ order, currentTab, onClose, onSave, onStatusChange, onCancel, onEmail, onWhatsApp, onInvoice, onCobrar, onEntregar }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  // Estado local para gestionar los pares editables
  const [localShoePairs, setLocalShoePairs] = useState(
    order.shoePairs || [
      {
        id: 'legacy',
        model: order.model,
        service: order.service,
        price: order.price,
        images: order.images || [],
        notes: order.notes || '',
        status: 'pending' // Estado por defecto
      }
    ]
  );

  // Estado local para gestionar los otros items
  const [localOtherItems, setLocalOtherItems] = useState(order.otherItems || []);

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

  // Referencia al input de fecha
  const dateInputRef = useRef(null);

  // Obtener todos los pares (usando el estado local)
  const shoePairs = localShoePairs;

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

  // Calcular precio total excluyendo pares cancelados y sumando otros items (reactivo)
  const totalPrice = useMemo(() => {
    let shoesTotal = 0;

    // Calcular total de tenis
    if (localShoePairs && localShoePairs.length > 0 && localShoePairs[0].id !== 'legacy') {
      shoesTotal = localShoePairs
        .filter(pair => pair.status !== 'cancelled')
        .reduce((sum, pair) => sum + (pair.price || 0), 0);
    } else {
      // Formato antiguo
      shoesTotal = order.totalPrice || order.price || 0;
    }

    // Calcular total de otros items
    const otherItemsTotal = localOtherItems
      .filter(item => item.status !== 'cancelled')
      .reduce((sum, item) => sum + (item.price || 0), 0);

    return shoesTotal + otherItemsTotal;
  }, [localShoePairs, localOtherItems, order.totalPrice, order.price]);

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

  // Obtener todas las imágenes de todos los pares y otros items
  const getAllImages = () => {
    const shoePairsImages = shoePairs.flatMap(pair => pair.images || []);
    const otherItemsImages = localOtherItems.flatMap(item => item.images || []);
    return [...shoePairsImages, ...otherItemsImages];
  };

  const handleWhatsApp = () => {
    const phone = order.phone.replace(/\D/g, '');
    const message = `Hola ${order.client}, tu orden está lista para recoger. Total: $${totalPrice}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Cambiar estado de un par individual
  const handlePairStatusChange = (pairId, newStatus) => {
    const updatedPairs = localShoePairs.map(pair =>
      pair.id === pairId ? { ...pair, status: newStatus } : pair
    );

    setLocalShoePairs(updatedPairs);

    const updatedOrder = {
      ...order,
      shoePairs: updatedPairs,
      otherItems: localOtherItems // Incluir otros items
    };

    // Llamar a onSave si está disponible
    if (onSave) {
      onSave(updatedOrder);
    }
  };

  // Cambiar imágenes de un par individual
  const handlePairImagesChange = (pairId, newImages) => {
    const updatedPairs = localShoePairs.map(pair =>
      pair.id === pairId ? { ...pair, images: newImages } : pair
    );

    setLocalShoePairs(updatedPairs);

    const updatedOrder = {
      ...order,
      shoePairs: updatedPairs,
      otherItems: localOtherItems // Incluir otros items
    };

    // Llamar a onSave si está disponible
    if (onSave) {
      onSave(updatedOrder);
    }
  };

  // Cambiar estado de un item
  const handleItemStatusChange = (itemId, newStatus) => {
    const updatedItems = localOtherItems.map(item =>
      item.id === itemId ? { ...item, status: newStatus } : item
    );

    setLocalOtherItems(updatedItems);

    const updatedOrder = {
      ...order,
      shoePairs: localShoePairs, // Incluir pares de tenis
      otherItems: updatedItems
    };

    // Llamar a onSave si está disponible
    if (onSave) {
      onSave(updatedOrder);
    }
  };

  // Cambiar imágenes de un item
  const handleItemImagesChange = (itemId, newImages) => {
    const updatedItems = localOtherItems.map(item =>
      item.id === itemId ? { ...item, images: newImages } : item
    );

    setLocalOtherItems(updatedItems);

    const updatedOrder = {
      ...order,
      shoePairs: localShoePairs, // Incluir pares de tenis
      otherItems: updatedItems
    };

    // Llamar a onSave si está disponible
    if (onSave) {
      onSave(updatedOrder);
    }
  };

  // Verificar si todos los items están completados o cancelados
  const allItemsCompletedOrCancelled = useMemo(() => {
    const allPairsValid = localShoePairs.every(pair =>
      pair.status === 'completed' || pair.status === 'cancelled'
    );
    const allOtherItemsValid = localOtherItems.every(item =>
      item.status === 'completed' || item.status === 'cancelled'
    );
    return allPairsValid && allOtherItemsValid;
  }, [localShoePairs, localOtherItems]);

  // Cambiar estado general de la orden
  const handleOrderStatusChange = (newStatus) => {
    // Validar si se intenta cambiar a "enEntrega"
    if (newStatus === 'enEntrega' && !allItemsCompletedOrCancelled) {
      alert('No se puede mover a "En Entrega" hasta que todos los items estén completados o cancelados');
      return;
    }

    setOrderStatus(newStatus);

    // Llamar a onStatusChange para mover la orden entre columnas
    if (onStatusChange) {
      onStatusChange(order, newStatus);
    }
  };

  // Handler para guardar la fecha de entrega
  const handleSaveDeliveryDate = (newDate) => {
    // Actualizar estado local inmediatamente para refrescar la vista
    setLocalDeliveryDate(newDate);

    const updatedOrder = {
      ...order,
      deliveryDate: newDate, // Guardar en formato YYYY-MM-DD
      shoePairs: localShoePairs,
      otherItems: localOtherItems
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
      {/* Galería de Imágenes Principal */}
      {getAllImages().length > 0 && (
        <div className="order-gallery-section">
          <h3 className="section-title">📸 Galería de Imágenes</h3>
          <div className="order-main-gallery">
            {getAllImages().map((image, index) => (
              <div
                key={index}
                className="gallery-image-card"
                onClick={() => openImageModal(image)}
              >
                <img src={image} alt={`Imagen ${index + 1}`} className="gallery-image" />
                <div className="gallery-image-overlay">
                  <span className="gallery-icon">🔍</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información de Pares de Tenis */}
      <div className="order-pairs-section">
        <h3 className="section-title">👟 Pares de Tenis ({shoePairs.length})</h3>
        <div className="pairs-grid">
          {shoePairs.map((pair, index) => (
            <div key={pair.id || index} className={`pair-detail-card pair-status-${pair.status || 'pending'}`}>
              <div className="pair-card-header">
                <div className="pair-header-left">
                  <span className="pair-number">Par #{index + 1}</span>
                  <span className={`pair-status-badge status-${pair.status || 'pending'}`}>
                    {getStatusLabel(pair.status || 'pending')}
                  </span>
                </div>
                <span className="pair-price-badge">${pair.price}</span>
              </div>

              <div className="pair-card-body">
                <div className="pair-info-row">
                  <span className="pair-info-label">Modelo:</span>
                  <span className="pair-info-value">{pair.model}</span>
                </div>
                <div className="pair-info-row">
                  <span className="pair-info-label">Servicio:</span>
                  <span className="pair-info-value">{pair.service}</span>
                </div>

                {/* Selector de Estado */}
                <div className="pair-status-selector">
                  <span className="pair-info-label">Estado del Par:</span>
                  <select
                    className={`pair-status-select status-${pair.status || 'pending'}`}
                    value={pair.status || 'pending'}
                    onChange={(e) => handlePairStatusChange(pair.id, e.target.value)}
                  >
                    {pairStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sección de imágenes editable */}
                <div className="pair-images-section">
                  <span className="pair-info-label">📸 Fotos del Par:</span>
                  <ImageUpload
                    images={pair.images || []}
                    onChange={(newImages) => handlePairImagesChange(pair.id, newImages)}
                  />
                </div>

                {pair.notes && (
                  <div className="pair-notes">
                    <span className="pair-info-label">Notas:</span>
                    <p className="pair-notes-text">{pair.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información de Otros Items */}
      {localOtherItems.length > 0 && (
        <div className="order-pairs-section">
          <h3 className="section-title">📦 Otros Items ({localOtherItems.length})</h3>
          <div className="pairs-grid">
            {localOtherItems.map((item, index) => (
              <div key={item.id || index} className={`pair-detail-card pair-status-${item.status || 'pending'}`}>
                <div className="pair-card-header">
                  <div className="pair-header-left">
                    <span className="pair-number">Item #{index + 1}</span>
                    <span className={`pair-status-badge status-${item.status || 'pending'}`}>
                      {getStatusLabel(item.status || 'pending')}
                    </span>
                  </div>
                  <span className="pair-price-badge">${item.price}</span>
                </div>

                <div className="pair-card-body">
                  <div className="pair-info-row">
                    <span className="pair-info-label">Tipo:</span>
                    <span className="pair-info-value">{item.itemType || '-'}</span>
                  </div>
                  <div className="pair-info-row">
                    <span className="pair-info-label">Descripción:</span>
                    <span className="pair-info-value">{item.description || '-'}</span>
                  </div>
                  <div className="pair-info-row">
                    <span className="pair-info-label">Servicio:</span>
                    <span className="pair-info-value">{item.service}</span>
                  </div>

                  {/* Selector de Estado */}
                  <div className="pair-status-selector">
                    <span className="pair-info-label">Estado del Item:</span>
                    <select
                      className={`pair-status-select status-${item.status || 'pending'}`}
                      value={item.status || 'pending'}
                      onChange={(e) => handleItemStatusChange(item.id, e.target.value)}
                    >
                      {pairStatuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sección de imágenes editable */}
                  <div className="pair-images-section">
                    <span className="pair-info-label">📸 Fotos del Item:</span>
                    <ImageUpload
                      images={item.images || []}
                      onChange={(newImages) => handleItemImagesChange(item.id, newImages)}
                    />
                  </div>

                  {item.notes && (
                    <div className="pair-notes">
                      <span className="pair-info-label">Notas:</span>
                      <p className="pair-notes-text">{item.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                    min={new Date().toISOString().split('T')[0]}
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
                  ⚠️ Para mover a "En Entrega", todos los items deben estar completados o cancelados
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notas Generales */}
      {order.generalNotes && (
        <div className="general-notes-section">
          <h3 className="section-title">📝 Notas Generales</h3>
          <div className="notes-card">
            <p>{order.generalNotes}</p>
          </div>
        </div>
      )}

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
