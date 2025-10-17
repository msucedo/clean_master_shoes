import './ServiceCard.css';

const ServiceCard = ({ service, onEdit }) => {
  const { name, duration, price, description, stats, emoji } = service;

  const handleCardClick = () => {
    onEdit(service);
  };

  return (
    <div className="service-card" onClick={handleCardClick}>
      <div className="service-header">
        <div className="service-title-section">
          <div className="service-name">
            <span className="service-emoji">{emoji || '⚙️'}</span>
            {name}
          </div>
          <div className="service-duration">⏱️ {duration}</div>
        </div>
        <div className="service-price">${price}</div>
      </div>

      <div className="service-description">{description}</div>

      <div className="service-stats">
        <div className="service-stat">
          <div className="service-stat-value">{stats?.thisMonth || 0}</div>
          <div className="service-stat-label">Este mes</div>
        </div>
        <div className="service-stat">
          <div className="service-stat-value">{stats?.total || 0}</div>
          <div className="service-stat-label">Total</div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
