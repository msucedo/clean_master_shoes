import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getOrderByTrackingToken } from '../services/firebaseService';
import '../styles/OrderTracking.css';

/**
 * OrderTracking - Public order tracking page
 * Accessible without authentication via /rastrear/:token
 * Shows customer their order status, photos, services, and payment info
 */
function OrderTracking() {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate token format
        if (!token || token.length < 8) {
          setError('invalid-token');
          setLoading(false);
          return;
        }

        // Fetch order by tracking token
        const orderData = await getOrderByTrackingToken(token);

        if (!orderData) {
          setError('not-found');
          setLoading(false);
          return;
        }

        setOrder(orderData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading order:', err);
        setError('fetch-error');
        setLoading(false);
      }
    };

    loadOrder();
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
      recibidos: { label: 'Recibido', color: '#3b82f6', icon: '📦' },
      proceso: { label: 'En Proceso', color: '#f59e0b', icon: '⚙️' },
      listos: { label: 'Listo', color: '#10b981', icon: '✅' },
      enEntrega: { label: 'En Entrega', color: '#8b5cf6', icon: '🚚' },
      completados: { label: 'Completado', color: '#22c55e', icon: '🎉' },
      cancelado: { label: 'Cancelado', color: '#ef4444', icon: '❌' }
    };
    return statusMap[status] || statusMap.recibidos;
  };

  const statusInfo = getStatusInfo(order.orderStatus);

  return (
    <div className="tracking-container">
      <div className="tracking-card">
        {/* Header */}
        <div className="tracking-header">
          <h1>Clean Master Shoes</h1>
          <p className="tracking-subtitle">Seguimiento de Orden</p>
        </div>

        {/* Order Number */}
        <div className="order-number-section">
          <span className="order-number-label">Orden #</span>
          <span className="order-number">{order.orderNumber}</span>
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

        {/* Footer */}
        <div className="tracking-footer">
          <p className="footer-text">
            Gracias por confiar en Clean Master Shoes 👟✨
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrderTracking;
