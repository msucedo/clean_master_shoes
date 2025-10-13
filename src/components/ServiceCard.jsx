import './ServiceCard.css';

const ServiceCard = ({ name, duration, price, description, stats }) => {
  const handleEdit = (e) => {
    e.stopPropagation();
    console.log('Edit service:', name);
    // Here you would open edit modal
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`¿Eliminar el servicio "${name}"?`)) {
      console.log('Delete service:', name);
      // Here you would delete the service
    }
  };

  const handleCardClick = () => {
    console.log('View service details:', name);
    // Here you would open a modal to view/edit service details
  };

  return (
    <div className="service-card" onClick={handleCardClick}>
      <div className="service-header">
        <div className="service-title-section">
          <div className="service-name">{name}</div>
          <div className="service-duration">⏱️ {duration}</div>
        </div>
        <div className="service-price">${price}</div>
      </div>

      <div className="service-description">{description}</div>

      <div className="before-after-section">
        <div className="before-after-label">Ejemplo Antes/Después</div>
        <div className="before-after-photos">
          <div className="photo-container">
            <div className="photo-label before">Antes</div>
            <div className="service-photo">👟</div>
          </div>
          <div className="photo-container">
            <div className="photo-label after">Después</div>
            <div className="service-photo">✨</div>
          </div>
        </div>
      </div>

      <div className="service-stats">
        <div className="service-stat">
          <div className="service-stat-value">{stats.thisMonth}</div>
          <div className="service-stat-label">Este mes</div>
        </div>
        <div className="service-stat">
          <div className="service-stat-value">{stats.total}</div>
          <div className="service-stat-label">Total</div>
        </div>
      </div>

      <div className="service-actions">
        <button className="btn-action" onClick={handleEdit}>
          ✏️ Editar
        </button>
        <button className="btn-action delete" onClick={handleDelete}>
          🗑️ Eliminar
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;
