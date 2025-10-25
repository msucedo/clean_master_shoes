import { useMemo } from 'react';
import PropTypes from 'prop-types';
import './OrderCard.css';

// Función para formatear fecha de entrega
const formatDeliveryDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return { text: 'Hoy', className: 'urgent' };
  } else if (date.getTime() === tomorrow.getTime()) {
    return { text: 'Mañana', className: 'soon' };
  } else {
    const options = { day: 'numeric', month: 'short' };
    return {
      text: date.toLocaleDateString('es-ES', options),
      className: ''
    };
  }
};

// Componente Principal: OrderCard
const OrderCard = ({ order, onOrderClick }) => {
  // Obtener servicios activos (no cancelados)
  const activeServices = useMemo(() => {
    if (!order.services || order.services.length === 0) return [];
    return order.services.filter(service => service.status !== 'cancelled');
  }, [order.services]);

  // Verificar si todos los servicios están completados
  const allServicesCompleted = useMemo(() => {
    if (activeServices.length === 0) return false;
    return activeServices.every(service => service.status === 'completed');
  }, [activeServices]);

  // Agrupar servicios por emoji y contar
  const servicesByEmoji = useMemo(() => {
    const grouped = {};

    activeServices.forEach(service => {
      const emoji = service.icon || '🛠️';
      if (!grouped[emoji]) {
        grouped[emoji] = { emoji, count: 0 };
      }
      grouped[emoji].count++;
    });
    return Object.values(grouped);
  }, [activeServices]);

  // Obtener la primera imagen de la galería
  const firstImage = useMemo(() => {
    if (order.orderImages && order.orderImages.length > 0) {
      return order.orderImages[0];
    }
    return null;
  }, [order.orderImages]);

  const dateInfo = formatDeliveryDate(order.deliveryDate);

  // Check WhatsApp notification status
  const whatsappStatus = useMemo(() => {
    if (!order.whatsappNotifications || order.whatsappNotifications.length === 0) {
      return null;
    }

    // Buscar la última notificación enviada (outgoing)
    const lastSentNotification = order.whatsappNotifications
      .filter(n => n.status === 'sent' || n.status === 'failed')
      .pop();

    return {
      hasConversation: true, // Hay conversación activa
      sent: lastSentNotification?.status === 'sent',
      failed: lastSentNotification?.status === 'failed',
      error: lastSentNotification?.error,
      hasUnread: order.hasUnreadMessages === true // Badge de mensajes sin leer
    };
  }, [order.whatsappNotifications, order.hasUnreadMessages]);

  return (
    <div className="order-card" onClick={() => onOrderClick(order)}>
      {/* Header */}
      <div className="order-card-header">
        <div className="order-id-badge">#{parseInt(order.orderNumber, 10)}</div>
        {order.priority === 'high' && (
          <div className="order-priority-badge">Urgente</div>
        )}
        {whatsappStatus?.sent && (
          <div
            className="order-whatsapp-badge success"
            title={whatsappStatus.hasUnread ? "Nuevo mensaje recibido" : "Notificación de WhatsApp enviada"}
          >
            ✓
            {whatsappStatus.hasUnread && (
              <span className="whatsapp-unread-dot"></span>
            )}
          </div>
        )}
        {whatsappStatus?.failed && (
          <div className="order-whatsapp-badge error" title={`WhatsApp falló: ${whatsappStatus.error || 'Error desconocido'}`}>
            ✗
          </div>
        )}
        <div className={`order-delivery-badge ${dateInfo.className}`}>
          {dateInfo.text}
        </div>
      </div>

      {/* Servicios */}
      <div className="items-badges-container">
        {servicesByEmoji.map((service, index) => (
          <div
            key={index}
            className={`pairs-count-badge ${allServicesCompleted ? 'completed' : ''}`}
          >
            {service.emoji} {service.count}
          </div>
        ))}

        {activeServices.length === 0 && (
          <div className="pairs-count-badge">
            🛠️ 0 Servicios
          </div>
        )}
      </div>

      {/* Cliente */}
      <div className="order-client-section">
        <div className="order-client-name">{order.client}</div>
        <div className="order-client-phone">{order.phone}</div>
      </div>

      {/* Imagen de la orden */}
      {firstImage && (
        <div className="order-card-image">
          <img src={firstImage} alt={`Orden ${order.orderNumber || order.id}`} />
        </div>
      )}
    </div>
  );
};

OrderCard.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.string.isRequired,
    client: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    deliveryDate: PropTypes.string.isRequired,
    priority: PropTypes.string,
    services: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        serviceName: PropTypes.string.isRequired,
        icon: PropTypes.string,
        status: PropTypes.string
      })
    ),
    orderImages: PropTypes.array
  }).isRequired,
  onOrderClick: PropTypes.func.isRequired
};

export default OrderCard;
