import { useMemo } from 'react';
import PropTypes from 'prop-types';
import './OrderCard.css';

// Componente: Header de la tarjeta
const OrderCardHeader = ({ orderId, priority, deliveryDate, dateClass }) => (
  <div className="order-card-header">
    <div className="order-id-badge">#{orderId}</div>
    {priority === 'high' && (
      <div className="order-priority-badge">🔥 Urgente</div>
    )}
    <div className={`order-delivery-badge ${dateClass}`}>
      {deliveryDate}
    </div>
  </div>
);

OrderCardHeader.propTypes = {
  orderId: PropTypes.string.isRequired,
  priority: PropTypes.string,
  deliveryDate: PropTypes.string.isRequired,
  dateClass: PropTypes.string
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

  // Calcular precio total excluyendo pares cancelados
  const totalPrice = useMemo(() => {
    // Si tiene shoePairs, calcular total sumando solo pares no cancelados
    if (order.shoePairs && order.shoePairs.length > 0) {
      return order.shoePairs
        .filter(pair => pair.status !== 'cancelled')
        .reduce((sum, pair) => sum + (pair.price || 0), 0);
    }
    // Formato antiguo
    return order.totalPrice || order.price || 0;
  }, [order.shoePairs, order.totalPrice, order.price]);

  // Handlers
  const handleCardClick = () => {
    onOrderClick(order);
  };

  const pairsCount = activePairs.length;
  const pairsLabel = pairsCount === 1 ? 'Par' : 'Pares';

  return (
    <div className="order-card" onClick={handleCardClick}>
      <OrderCardHeader
        orderId={order.id}
        priority={order.priority}
        deliveryDate={order.deliveryDate}
        dateClass={order.dateClass}
      />

      <div className="pairs-count-badge">
        👟 {pairsCount} {pairsLabel}
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
    )
  }).isRequired,
  activeTab: PropTypes.string.isRequired,
  onOrderClick: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired
};

export default OrderCard;
