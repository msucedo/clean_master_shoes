import './OrderCardSkeleton.css';

const OrderCardSkeleton = () => {
  return (
    <div className="order-card-skeleton">
      {/* Header */}
      <div className="order-card-header-skeleton">
        <div className="skeleton skeleton-order-id"></div>
        <div className="skeleton skeleton-delivery-date"></div>
      </div>

      {/* Services Badges */}
      <div className="items-badges-skeleton">
        <div className="skeleton skeleton-service-badge"></div>
        <div className="skeleton skeleton-service-badge"></div>
        <div className="skeleton skeleton-service-badge"></div>
      </div>

      {/* Client Section */}
      <div className="order-client-skeleton">
        <div className="skeleton skeleton-client-name"></div>
        <div className="skeleton skeleton-client-phone"></div>
      </div>

      {/* Order Image (optional but show skeleton) */}
      <div className="skeleton skeleton-order-image"></div>
    </div>
  );
};

export default OrderCardSkeleton;
