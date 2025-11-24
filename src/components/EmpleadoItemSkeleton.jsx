import './EmpleadoItemSkeleton.css';

const EmpleadoItemSkeleton = () => {
  return (
    <div className="empleado-item-skeleton">
      <div className="skeleton skeleton-empleado-avatar"></div>

      <div className="empleado-info-skeleton">
        <div className="skeleton skeleton-empleado-name"></div>
        <div className="skeleton skeleton-empleado-role"></div>
      </div>

      <div className="empleado-meta-skeleton">
        <div className="empleado-meta-item-skeleton">
          <div className="skeleton skeleton-phone-value"></div>
          <div className="skeleton skeleton-phone-label"></div>
        </div>
        <div className="skeleton skeleton-status-badge"></div>
      </div>

      <div className="skeleton skeleton-hire-date"></div>

      <div className="empleado-actions-skeleton">
        <div className="skeleton skeleton-btn"></div>
        <div className="skeleton skeleton-btn"></div>
      </div>
    </div>
  );
};

export default EmpleadoItemSkeleton;
