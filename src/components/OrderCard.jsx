import './OrderCard.css';

const OrderCard = ({ order, onDragStart, onDragEnd, onClick }) => {
  const handleClick = (e) => {
    // Don't trigger click if currently dragging
    if (e.currentTarget.classList.contains('dragging')) {
      return;
    }
    if (onClick) {
      onClick(order);
    }
  };

  return (
    <div
      className="order-card"
      draggable="true"
      onDragStart={(e) => onDragStart(e, order)}
      onDragEnd={onDragEnd}
      onClick={handleClick}
    >
      <div className="card-header">
        <span className="card-id">#{order.id}</span>
        <span className={`card-priority ${order.priority || ''}`}></span>
      </div>
      <div className="sneaker-image">👟</div>
      <div className="card-client">{order.client}</div>
      <div className="card-phone">{order.phone}</div>
      <div className="card-model">{order.model}</div>
      <div className="card-service">{order.service}</div>
      <div className="card-footer">
        <div className="card-price">${order.price}</div>
        <div className={`card-date ${order.dateClass || ''}`}>
          {order.deliveryDate}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
