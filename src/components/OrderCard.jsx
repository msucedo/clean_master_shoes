import { useMemo } from 'react';
import PropTypes from 'prop-types';
import './OrderCard.css';

// Función para formatear fecha de entrega
const formatDeliveryDate = (dateString) => {
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

// Componente: Header de la tarjeta
const OrderCardHeader = ({ orderId, priority, deliveryDate }) => {
  const dateInfo = formatDeliveryDate(deliveryDate);

  return (
    <div className="order-card-header">
      <div className="order-id-badge">#{orderId}</div>
      {priority === 'high' && (
        <div className="order-priority-badge">🔥 Urgente</div>
      )}
      <div className={`order-delivery-badge ${dateInfo.className}`}>
        {dateInfo.text}
      </div>
    </div>
  );
};

OrderCardHeader.propTypes = {
  orderId: PropTypes.string.isRequired,
  priority: PropTypes.string,
  deliveryDate: PropTypes.string.isRequired
};

// Componente: Sección de cliente
const ClientSection = ({ clientName, phone }) => (
  <div className="order-client-section">
    <div className="order-client-name">{clientName}</div>
    <div className="order-client-phone">{phone}</div>
  </div>
);

ClientSection.propTypes = {
  clientName: PropTypes.string.isRequired,
  phone: PropTypes.string.isRequired
};

// Componente: Footer con precio
const OrderCardFooter = ({ totalPrice }) => (
  <div className="order-card-footer">
    <div className="order-total-price">
      ${totalPrice}
    </div>
  </div>
);

OrderCardFooter.propTypes = {
  totalPrice: PropTypes.number.isRequired
};

// Utilidad: Normalizar pares de tenis (formato antiguo → nuevo)
const normalizePairs = (order) => {
  if (order.shoePairs && order.shoePairs.length > 0) {
    return order.shoePairs;
  }

  // Convertir formato antiguo a nuevo
  return [{
    id: 'legacy',
    model: order.model,
    service: order.service,
    price: order.price,
    status: 'pending'
  }];
};

// Componente Principal: OrderCard
const OrderCard = ({ order, activeTab, onOrderClick, onStatusChange }) => {
  // Normalizar pares con memoization
  const allPairs = useMemo(() => normalizePairs(order), [order]);

  // Filtrar pares no cancelados para mostrar
  const activePairs = useMemo(() => {
    return allPairs.filter(pair => pair.status !== 'cancelled');
  }, [allPairs]);

  // Filtrar otros items no cancelados
  const activeOtherItems = useMemo(() => {
    if (!order.otherItems || order.otherItems.length === 0) return [];
    return order.otherItems.filter(item => item.status !== 'cancelled');
  }, [order.otherItems]);

  // Calcular precio total excluyendo pares cancelados
  const totalPrice = useMemo(() => {
    // Si tiene shoePairs, calcular total sumando solo pares no cancelados
    let total = 0;
    if (order.shoePairs && order.shoePairs.length > 0) {
      total += order.shoePairs
        .filter(pair => pair.status !== 'cancelled')
        .reduce((sum, pair) => sum + (pair.price || 0), 0);
    } else {
      // Formato antiguo
      total += order.totalPrice || order.price || 0;
    }

    // Agregar precio de otros items
    if (order.otherItems && order.otherItems.length > 0) {
      total += order.otherItems
        .filter(item => item.status !== 'cancelled')
        .reduce((sum, item) => sum + (item.price || 0), 0);
    }

    return total;
  }, [order.shoePairs, order.otherItems, order.totalPrice, order.price]);

  // Handlers
  const handleCardClick = () => {
    onOrderClick(order);
  };

  const pairsCount = activePairs.length;
  const pairsLabel = pairsCount === 1 ? 'Par' : 'Pares';

  // Verificar si todos los pares están completados
  const allPairsCompleted = useMemo(() => {
    if (activePairs.length === 0) return false;
    return activePairs.every(pair => pair.status === 'completed');
  }, [activePairs]);

  // Verificar si todos los otros items están completados
  const allOtherItemsCompleted = useMemo(() => {
    if (activeOtherItems.length === 0) return false;
    return activeOtherItems.every(item => item.status === 'completed');
  }, [activeOtherItems]);

  // Mapeo de tipos de items a iconos
  const itemTypeIcons = {
    bag: '👜',
    hat: '🧢',
    backpack: '🎒',
    jacket: '🧥',
    other: '📦'
  };

  // Obtener iconos únicos de los items
  const otherItemsIcons = useMemo(() => {
    if (activeOtherItems.length === 0) return '';
    const uniqueTypes = [...new Set(activeOtherItems.map(item => item.itemType))];
    return uniqueTypes.map(type => itemTypeIcons[type] || '📦').join(' ');
  }, [activeOtherItems]);

  return (
    <div className="order-card" onClick={handleCardClick}>
      <OrderCardHeader
        orderId={order.id}
        priority={order.priority}
        deliveryDate={order.deliveryDate}
      />

      <div className="items-badges-container">
        <div className={`pairs-count-badge ${allPairsCompleted ? 'completed' : ''}`}>
          👟 {pairsCount} {pairsLabel}
        </div>

        {activeOtherItems.length > 0 && (
          <div className={`other-items-count-badge ${allOtherItemsCompleted ? 'completed' : ''}`}>
            {otherItemsIcons} {activeOtherItems.length} {activeOtherItems.length === 1 ? 'Item' : 'Items'}
          </div>
        )}
      </div>

      <ClientSection
        clientName={order.client}
        phone={order.phone}
      />

      <OrderCardFooter
        totalPrice={totalPrice}
      />
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
    dateClass: PropTypes.string,
    totalPrice: PropTypes.number,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    model: PropTypes.string,
    service: PropTypes.string,
    shoePairs: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        model: PropTypes.string.isRequired,
        service: PropTypes.string.isRequired,
        price: PropTypes.number,
        status: PropTypes.string,
        images: PropTypes.array,
        notes: PropTypes.string
      })
    ),
    otherItems: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        itemType: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        service: PropTypes.string.isRequired,
        price: PropTypes.number,
        status: PropTypes.string,
        images: PropTypes.array,
        notes: PropTypes.string
      })
    )
  }).isRequired,
  activeTab: PropTypes.string.isRequired,
  onOrderClick: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired
};

export default OrderCard;
