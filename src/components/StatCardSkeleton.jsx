import './StatCardSkeleton.css';

const StatCardSkeleton = ({ count = 3 }) => {
  return (
    <div className="stat-cards-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="stat-card-skeleton-item">
          <div className="skeleton skeleton-stat-icon-card"></div>
          <div className="stat-content-skeleton-card">
            <div className="skeleton skeleton-stat-value-card"></div>
            <div className="skeleton skeleton-stat-label-card"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCardSkeleton;
