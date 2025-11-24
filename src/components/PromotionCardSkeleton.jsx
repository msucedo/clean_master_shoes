import './PromotionCardSkeleton.css';

const PromotionCardSkeleton = () => {
  return (
    <div className="promotion-card-skeleton">
      <div className="promotion-header-skeleton">
        <div className="promotion-title-section-skeleton">
          <div className="skeleton skeleton-promotion-emoji"></div>
          <div className="skeleton-text-group">
            <div className="skeleton skeleton-promotion-name"></div>
            <div className="skeleton skeleton-promotion-type"></div>
          </div>
        </div>
        <div className="skeleton skeleton-promotion-discount"></div>
      </div>

      <div className="skeleton skeleton-status-badge"></div>

      <div className="skeleton skeleton-promotion-description"></div>

      <div className="promotion-details-skeleton">
        <div className="skeleton skeleton-detail"></div>
        <div className="skeleton skeleton-detail"></div>
        <div className="skeleton skeleton-detail"></div>
      </div>

      <div className="promotion-actions-skeleton">
        <div className="skeleton skeleton-btn-action"></div>
        <div className="skeleton skeleton-btn-action"></div>
      </div>
    </div>
  );
};

export default PromotionCardSkeleton;
