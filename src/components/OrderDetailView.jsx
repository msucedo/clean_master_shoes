import { useState } from 'react';
import './OrderDetailView.css';

const OrderDetailView = ({ order, onClose, onSave, onCancel, onEmail, onWhatsApp, onInvoice }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  // Obtener todos los pares (nuevo formato o convertir del antiguo)
  const shoePairs = order.shoePairs || [
    {
      id: 'legacy',
      model: order.model,
      service: order.service,
      price: order.price,
      images: order.images || [],
      notes: order.notes || '',
      status: 'pending' // Estado por defecto
    }
  ];

  // Estados disponibles para cada par
  const pairStatuses = [
    { value: 'pending', label: '⏳ Pendiente', color: '#fbbf24' },
    { value: 'in-progress', label: '🔄 En Proceso', color: '#0096ff' },
    { value: 'completed', label: '✅ Completado', color: '#10b981' },
    { value: 'delivered', label: '📦 Entregado', color: '#8b5cf6' }
  ];

  // Calcular precio total
  const totalPrice = order.totalPrice || order.price || 0;
  const advancePayment = parseFloat(order.advancePayment) || 0;
  const remainingPayment = totalPrice - advancePayment;

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

  // Obtener todas las imágenes de todos los pares
  const getAllImages = () => {
    return shoePairs.flatMap(pair => pair.images || []);
  };

  const handleWhatsApp = () => {
    const phone = order.phone.replace(/\D/g, '');
    const message = `Hola ${order.client}, tu orden está lista para recoger. Total: $${totalPrice}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Cambiar estado de un par individual
  const handlePairStatusChange = (pairId, newStatus) => {
    const updatedPairs = shoePairs.map(pair =>
      pair.id === pairId ? { ...pair, status: newStatus } : pair
    );

    const updatedOrder = {
      ...order,
      shoePairs: updatedPairs
    };

    // Llamar a onSave si está disponible
    if (onSave) {
      onSave(updatedOrder);
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

                {pair.images && pair.images.length > 0 && (
                  <div className="pair-images-preview">
                    <span className="pair-info-label">Fotos:</span>
                    <div className="pair-thumbnails">
                      {pair.images.slice(0, 3).map((image, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={image}
                          alt={`${pair.model} - ${imgIndex + 1}`}
                          className="pair-thumbnail"
                          onClick={() => openImageModal(image)}
                        />
                      ))}
                      {pair.images.length > 3 && (
                        <div className="thumbnail-more">
                          +{pair.images.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
              <span className="detail-value">{getPaymentMethodLabel(order.paymentMethod)}</span>
            </div>
          </div>
        </div>

        {/* Entrega */}
        <div className="detail-card">
          <h3 className="detail-card-title">📅 Información de Entrega</h3>
          <div className="detail-card-content">
            <div className="detail-row">
              <span className="detail-label">Fecha de Entrega:</span>
              <span className="detail-value">{order.deliveryDate}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Estado:</span>
              <span className={`status-badge status-${order.status || 'pending'}`}>
                {order.status === 'pending' && '⏳ Pendiente'}
                {order.status === 'in-progress' && '🔄 En Proceso'}
                {order.status === 'ready' && '✅ Listo'}
                {order.status === 'delivered' && '📦 Entregado'}
                {!order.status && '⏳ Pendiente'}
              </span>
            </div>
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
            className="action-btn btn-edit"
            onClick={onClose}
          >
            <span className="action-icon">✏️</span>
            <span className="action-text">Editar Orden</span>
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
