import './ServiceCardSkeleton.css';

const ServiceCardSkeleton = () => {
  return (
    <div className="service-card-skeleton">
      <div className="service-header-skeleton">
        <div className="service-title-section-skeleton">
          <div className="skeleton skeleton-service-emoji"></div>
          <div className="skeleton-text-group">
            <div className="skeleton skeleton-service-name"></div>
            <div className="skeleton skeleton-service-duration"></div>
          </div>
        </div>
        <div className="skeleton skeleton-service-price"></div>
      </div>

      <div className="skeleton skeleton-service-description"></div>

      <div className="service-stats-skeleton">
        <div className="service-stat-skeleton">
          <div className="skeleton skeleton-stat-value"></div>
          <div className="skeleton skeleton-stat-label"></div>
        </div>
        <div className="service-stat-skeleton">
          <div className="skeleton skeleton-stat-value"></div>
          <div className="skeleton skeleton-stat-label"></div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCardSkeleton;
