import './ToggleSkeleton.css';

const ToggleSkeleton = ({ count = 2 }) => {
  return (
    <div className="toggle-skeleton-container">
      <div className="skeleton skeleton-description"></div>

      <div className="toggle-skeleton-group">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="toggle-skeleton-item">
            <div className="toggle-skeleton-info">
              <div className="skeleton skeleton-toggle-title"></div>
              <div className="skeleton skeleton-toggle-desc"></div>
            </div>
            <div className="skeleton skeleton-toggle-switch"></div>
          </div>
        ))}
      </div>

      <div className="skeleton-btn-group">
        <div className="skeleton skeleton-btn skeleton-btn-primary"></div>
        <div className="skeleton skeleton-btn skeleton-btn-secondary"></div>
      </div>
    </div>
  );
};

export default ToggleSkeleton;
