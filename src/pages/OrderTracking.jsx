import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getOrderByTrackingToken, getBusinessProfile } from '../services/firebaseService';
import '../styles/OrderTracking.css';

/**
 * OrderTracking - Public order tracking page
 * Accessible without authentication via /rastrear/:token
 * Shows customer their order status, photos, services, and payment info
 */
function OrderTracking() {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate token format
        if (!token || token.length < 8) {
          console.error('[OrderTracking] Token too short:', token?.length);
          setError('invalid-token');
          setLoading(false);
          return;
        }

        // Token should only contain alphanumeric characters
        if (!/^[a-z0-9]+$/i.test(token)) {
          console.error('[OrderTracking] Token contains invalid characters');
          setError('invalid-token');
          setLoading(false);
          return;
        }

        console.log('[OrderTracking] Loading data for token:', token);

        // Fetch order and business profile in parallel
        const [orderData, profileData] = await Promise.all([
          getOrderByTrackingToken(token),
          getBusinessProfile()
        ]);

        if (!orderData) {
          console.log('[OrderTracking] Order not found for token:', token);
          setError('not-found');
          setLoading(false);
          return;
        }

        console.log('[OrderTracking] Data loaded successfully');
        setOrder(orderData);
        setBusinessProfile(profileData);
        setLoading(false);
      } catch (err) {
        console.error('[OrderTracking] Error loading order:', err);

        // Detect specific error types
        if (err.message === 'Query timeout') {
          setError('timeout');
        } else if (err.code === 'permission-denied') {
          setError('permission-denied');
        } else if (!navigator.onLine) {
          setError('offline');
        } else {
          setError('fetch-error');
        }

        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  // Loading state
  if (loading) {
    return (
      <div className="tracking-container">
        <div className="tracking-card">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Cargando tu orden...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (error === 'invalid-token') {
    return (
      <div className="tracking-container">
        <div className="tracking-card">
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <h2>Link inválido</h2>
            <p>El link de seguimiento no es válido.</p>
            <p className="error-hint">Por favor verifica que hayas copiado el link completo.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'not-found') {
    return (
      <div className="tracking-container">
        <div className="tracking-card">
          <div className="error-state">
            <span className="error-icon">🔍</span>
            <h2>Orden no encontrada</h2>
            <p>No pudimos encontrar una orden con este código de seguimiento.</p>
            <p className="error-hint">Si crees que esto es un error, contacta a Clean Master Shoes.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'timeout') {
    return (
      <div className="tracking-container">
        <div className="tracking-card">
          <div className="error-state">
            <span className="error-icon">⏱️</span>
            <h2>Tiempo de espera agotado</h2>
            <p>La consulta tardó demasiado tiempo.</p>
            <p className="error-hint">Esto puede ser un problema temporal. Por favor intenta de nuevo.</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'permission-denied') {
    return (
      <div className="tracking-container">
        <div className="tracking-card">
          <div className="error-state">
            <span className="error-icon">🔒</span>
            <h2>Acceso denegado</h2>
            <p>No tienes permisos para acceder a esta orden.</p>
            <p className="error-hint">Verifica que el link sea correcto o contacta a Clean Master Shoes.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'offline') {
    return (
      <div className="tracking-container">
        <div className="tracking-card">
          <div className="error-state">
            <span className="error-icon">📡</span>
            <h2>Sin conexión</h2>
            <p>No hay conexión a internet.</p>
            <p className="error-hint">Por favor verifica tu conexión e intenta de nuevo.</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'fetch-error') {
    return (
      <div className="tracking-container">
        <div className="tracking-card">
          <div className="error-state">
            <span className="error-icon">❌</span>
            <h2>Error de conexión</h2>
            <p>No pudimos cargar la información de tu orden.</p>
            <p className="error-hint">Por favor verifica tu conexión a internet e intenta de nuevo.</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success - Show order details
  const getStatusInfo = (status) => {
    const statusMap = {
      recibidos: { label: 'Recibido', color: '#3b82f6', icon: '📦', step: 1 },
      proceso: { label: 'En Proceso', color: '#f59e0b', icon: '⚙️', step: 2 },
      listos: { label: 'Listo', color: '#10b981', icon: '✅', step: 3 },
      enEntrega: { label: 'En Entrega', color: '#8b5cf6', icon: '🚚', step: 4 },
      completados: { label: 'Completado', color: '#22c55e', icon: '🎉', step: 5 },
      cancelado: { label: 'Cancelado', color: '#ef4444', icon: '❌', step: 0 }
    };
    return statusMap[status] || statusMap.recibidos;
  };

  const statusInfo = getStatusInfo(order.orderStatus);
  const currentStep = statusInfo.step;

  // Calculate totals
  const totalItems = (order.shoePairs?.length || 0) + (order.otherItems?.length || 0);
  const totalProducts = order.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0;

  return (
    <div className="tracking-container">
      <div className="tracking-card">
        {/* Header with Logo */}
        <div className="tracking-header">
          <img
            src={businessProfile?.logoUrl || '/logo.png'}
            alt={businessProfile?.businessName || 'Clean Master Shoes'}
            className="tracking-logo"
            loading="eager"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <p className="tracking-subtitle">Seguimiento de Orden</p>
        </div>

        {/* Order Number */}
        <div className="order-number-section">
          <span className="order-number-label">Orden #</span>
          <span className="order-number">{order.orderNumber}</span>
        </div>

        {/* Status Timeline */}
        <div className="timeline-section">
          <div className="timeline">
            <div className={`timeline-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="timeline-icon">📦</div>
              <div className="timeline-label">Recibido</div>
            </div>
            <div className={`timeline-line ${currentStep > 1 ? 'completed' : ''}`}></div>
            <div className={`timeline-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <div className="timeline-icon">⚙️</div>
              <div className="timeline-label">Proceso</div>
            </div>
            <div className={`timeline-line ${currentStep > 2 ? 'completed' : ''}`}></div>
            <div className={`timeline-step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
              <div className="timeline-icon">✅</div>
              <div className="timeline-label">Listo</div>
            </div>
            <div className={`timeline-line ${currentStep > 3 ? 'completed' : ''}`}></div>
            <div className={`timeline-step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
              <div className="timeline-icon">🚚</div>
              <div className="timeline-label">Entrega</div>
            </div>
            <div className={`timeline-line ${currentStep > 4 ? 'completed' : ''}`}></div>
            <div className={`timeline-step ${currentStep >= 5 ? 'active completed' : ''}`}>
              <div className="timeline-icon">🎉</div>
              <div className="timeline-label">Completado</div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="status-section">
          <div className="status-badge" style={{ backgroundColor: statusInfo.color }}>
            <span className="status-icon">{statusInfo.icon}</span>
            <span className="status-label">{statusInfo.label}</span>
          </div>
        </div>

        {/* Customer Name */}
        <div className="info-section">
          <p className="customer-name">
            <strong>Cliente:</strong> {order.client}
          </p>
        </div>

        {/* Status Message */}
        <div className="message-section">
          {order.orderStatus === 'recibidos' && (
            <p>Tu orden ha sido recibida y será procesada pronto. 📋</p>
          )}
          {order.orderStatus === 'proceso' && (
            <p>Estamos trabajando en tu orden. ⚙️</p>
          )}
          {order.orderStatus === 'listos' && (
            <p>¡Tu orden está lista! Pendiente de entrega. ✅</p>
          )}
          {order.orderStatus === 'enEntrega' && (
            <p>Tu orden está en camino. ¡Pronto llegará a tus manos! 🚚</p>
          )}
          {order.orderStatus === 'completados' && (
            <p>¡Orden completada! Gracias por tu preferencia. 🎉</p>
          )}
          {order.orderStatus === 'cancelado' && (
            <p>Esta orden ha sido cancelada. ❌</p>
          )}
        </div>

        {/* Services Section */}
        {order.services && order.services.length > 0 && (
          <div className="details-section">
            <h3 className="section-title">Servicios</h3>
            <div className="services-list">
              {order.services.map((service, index) => (
                <div key={index} className="service-item">
                  <span className="service-emoji">{service.serviceEmoji || '✨'}</span>
                  <span className="service-name">{service.serviceName}</span>
                  <span className="service-count">
                    {totalItems > 0 && `×${totalItems}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shoe Pairs Section */}
        {order.shoePairs && order.shoePairs.length > 0 && (
          <div className="details-section">
            <h3 className="section-title">Tenis ({order.shoePairs.length} pares)</h3>
            <div className="items-list">
              {order.shoePairs.map((pair, index) => (
                <div key={index} className="item-row">
                  <span className="item-icon">👟</span>
                  <span className="item-text">
                    {pair.brand && pair.color
                      ? `${pair.brand} - ${pair.color}`
                      : `Par ${index + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Items Section */}
        {order.otherItems && order.otherItems.length > 0 && (
          <div className="details-section">
            <h3 className="section-title">Otros artículos</h3>
            <div className="items-list">
              {order.otherItems.map((item, index) => (
                <div key={index} className="item-row">
                  <span className="item-icon">{item.emoji || '📦'}</span>
                  <span className="item-text">{item.type || `Artículo ${index + 1}`}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        {order.products && order.products.length > 0 && (
          <div className="details-section">
            <h3 className="section-title">Productos ({totalProducts})</h3>
            <div className="products-list">
              {order.products.map((product, index) => (
                <div key={index} className="product-item">
                  <span className="product-emoji">{product.emoji || '🛍️'}</span>
                  <span className="product-name">{product.name}</span>
                  <span className="product-quantity">×{product.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos Gallery */}
        {order.photos && order.photos.length > 0 && (
          <div className="details-section">
            <h3 className="section-title">Fotos</h3>
            <div className="photos-gallery">
              {order.photos.map((photo, index) => (
                <div key={index} className="photo-item">
                  <img
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    className="photo-img"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      console.error('Error loading image:', photo);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Information */}
        <div className="payment-section">
          <h3 className="section-title">Información de Pago</h3>
          <div className="payment-details">
            <div className="payment-row">
              <span className="payment-label">Total:</span>
              <span className="payment-value total">${order.totalPrice?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="payment-row">
              <span className="payment-label">Pagado:</span>
              <span className="payment-value paid">${order.advancePayment?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="payment-row">
              <span className="payment-label">Pendiente:</span>
              <span className={`payment-value pending ${((order.totalPrice || 0) - (order.advancePayment || 0)) > 0 ? 'has-pending' : ''}`}>
                ${((order.totalPrice || 0) - (order.advancePayment || 0)).toFixed(2)}
              </span>
            </div>
            {order.paymentMethod && (
              <div className="payment-row">
                <span className="payment-label">Método:</span>
                <span className="payment-value">{order.paymentMethod}</span>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Date */}
        {order.deliveryDate && (
          <div className="delivery-section">
            <p className="delivery-label">📅 Fecha de entrega estimada:</p>
            <p className="delivery-date">
              {new Date(order.deliveryDate).toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}

        {/* Business Info */}
        {businessProfile && (
          <div className="business-info">
            {businessProfile.address && (
              <p className="business-detail">
                <span className="detail-icon">📍</span>
                {businessProfile.address}
              </p>
            )}
            {businessProfile.phone && (
              <p className="business-detail">
                <span className="detail-icon">📞</span>
                {businessProfile.phone}
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="tracking-footer">
          <p className="footer-text">
            Gracias por confiar en {businessProfile?.businessName || 'Clean Master Shoes'} 👟✨
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrderTracking;
