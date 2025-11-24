import './InventoryStatsSkeleton.css';

const InventoryStatsSkeleton = () => {
  return (
    <div className="inventory-stats-skeleton">
      {[1, 2, 3].map((index) => (
        <div key={index} className="stat-item-skeleton">
          <div className="skeleton skeleton-stat-icon"></div>
          <div className="stat-content-skeleton">
            <div className="skeleton skeleton-stat-value"></div>
            <div className="skeleton skeleton-stat-label"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InventoryStatsSkeleton;
