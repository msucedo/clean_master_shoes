import OrderCard from './OrderCard';
import './KanbanColumn.css';

const KanbanColumn = ({
  title,
  icon,
  count,
  type,
  orders,
  onDrop,
  onDragOver,
  onDragLeave,
  onDragStart,
  onDragEnd,
  onCardClick
}) => {
  return (
    <div
      className={`kanban-column ${type}`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, type)}
      onDragLeave={onDragLeave}
    >
      <div className="column-header">
        <div className="column-title-wrapper">
          <div className="column-icon">{icon}</div>
          <div>
            <div className="column-title">{title}</div>
            <div className="column-count">{count} {count === 1 ? 'orden' : 'órdenes'}</div>
          </div>
        </div>
      </div>
      <div className="cards-container">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
};

export default KanbanColumn;
