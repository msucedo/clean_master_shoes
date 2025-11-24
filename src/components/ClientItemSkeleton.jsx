import './ClientItemSkeleton.css';

const ClientItemSkeleton = () => {
  return (
    <div className="client-item-skeleton">
      <div className="skeleton skeleton-client-avatar"></div>

      <div className="client-info-skeleton">
        <div className="skeleton skeleton-client-name-skel"></div>
        <div className="skeleton skeleton-client-phone-skel"></div>
      </div>

      <div className="client-meta-skeleton">
        <div className="client-meta-item-skeleton">
          <div className="skeleton skeleton-meta-value"></div>
          <div className="skeleton skeleton-meta-label"></div>
        </div>
        <div className="client-meta-item-skeleton">
          <div className="skeleton skeleton-meta-value"></div>
          <div className="skeleton skeleton-meta-label"></div>
        </div>
      </div>

      <div className="skeleton skeleton-last-visit"></div>

      <div className="client-actions-skeleton">
        <div className="skeleton skeleton-btn"></div>
        <div className="skeleton skeleton-btn-history"></div>
      </div>
    </div>
  );
};

export default ClientItemSkeleton;
