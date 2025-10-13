import { useMemo } from 'react';
import PropTypes from 'prop-types';
import './OrderCard.css';

// Constantes
const STATUS_ICONS = {
  completed: '✅',
  'in-progress': '🔄',
  delivered: '📦',
  pending: '⏳'
};

const STATUS_OPTIONS = [
  { value: 'recibidos', label: '📥 Recibidos' },
  { value: 'proceso', label: '🔧 En Proceso' },
  { value: 'listos', label: '✅ Listos' }
];

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

// Componente: Preview de un par individual
const PairPreviewItem = ({ pair }) => (
  <div className="pair-preview-item">
    <div className="pair-preview-model">{pair.model}</div>
    <div className="pair-preview-details">
      <span className="pair-preview-service">{pair.service}</span>
      <span className={`pair-preview-status status-${pair.status || 'pending'}`}>
        {STATUS_ICONS[pair.status] || STATUS_ICONS.pending}
      </span>
    </div>
  </div>
);

PairPreviewItem.propTypes = {
  pair: PropTypes.shape({
    model: PropTypes.string.isRequired,
    service: PropTypes.string.isRequired,
    status: PropTypes.string
  }).isRequired
};

// Componente: Sección de pares de tenis
const PairsSummarySection = ({ pairs }) => {
  const displayPairs = pairs.slice(0, 2);
  const remainingCount = pairs.length - 2;
  const pairsLabel = pairs.length === 1 ? 'Par' : 'Pares';

  return (
    <div className="order-pairs-summary">
      <div className="pairs-count-badge">
        👟 {pairs.length} {pairsLabel}
      </div>
      <div className="pairs-preview">
        {displayPairs.map((pair, idx) => (
          <PairPreviewItem key={pair.id || idx} pair={pair} />
        ))}
        {remainingCount > 0 && (
          <div className="pair-preview-more">
            +{remainingCount} más
          </div>
        )}
      </div>
    </div>
  );
};

PairsSummarySection.propTypes = {
  pairs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      model: PropTypes.string.isRequired,
      service: PropTypes.string.isRequired,
      status: PropTypes.string
    })
  ).isRequired
};

// Componente: Footer con precio y selector de estado
const OrderCardFooter = ({ totalPrice, activeTab, onStatusChange, onSelectClick }) => (
  <div className="order-card-footer">
    <div className="order-total-price">
      Total: ${totalPrice}
    </div>
    <select
      className="order-status-selector"
      value={activeTab}
      onChange={onStatusChange}
      onClick={onSelectClick}
    >
      {STATUS_OPTIONS.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

OrderCardFooter.propTypes = {
  totalPrice: PropTypes.number.isRequired,
  activeTab: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onSelectClick: PropTypes.func.isRequired
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
  const pairs = useMemo(() => normalizePairs(order), [order]);

  // Calcular precio total con memoization
  const totalPrice = useMemo(() => {
    return order.totalPrice || order.price || 0;
  }, [order.totalPrice, order.price]);

  // Handlers
  const handleCardClick = () => {
    onOrderClick(order);
  };

  const handleStatusChange = (e) => {
    e.stopPropagation();
    onStatusChange(order, e.target.value);
  };

  const handleSelectClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="order-card" onClick={handleCardClick}>
      <OrderCardHeader
        orderId={order.id}
        priority={order.priority}
        deliveryDate={order.deliveryDate}
        dateClass={order.dateClass}
      />

      <ClientSection
        clientName={order.client}
        phone={order.phone}
      />

      <PairsSummarySection pairs={pairs} />

      <OrderCardFooter
        totalPrice={totalPrice}
        activeTab={activeTab}
        onStatusChange={handleStatusChange}
        onSelectClick={handleSelectClick}
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
