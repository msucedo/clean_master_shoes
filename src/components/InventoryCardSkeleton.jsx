import './InventoryCardSkeleton.css';

const InventoryCardSkeleton = () => {
  return (
    <div className="inventory-card-skeleton">
      {/* Product Image Skeleton */}
      <div className="product-image-skeleton-container">
        <div className="skeleton skeleton-product-image"></div>
        <div className="skeleton skeleton-category-badge"></div>
      </div>

      {/* Product Info Skeleton */}
      <div className="product-info-skeleton">
        {/* Product Name & Barcode */}
        <div className="product-header-skeleton">
          <div className="skeleton skeleton-product-name"></div>
          <div className="skeleton skeleton-barcode"></div>
        </div>

        {/* Stock Badge */}
        <div className="skeleton skeleton-stock-badge"></div>

        {/* Pricing Section */}
        <div className="product-pricing-skeleton">
          <div className="price-item-skeleton">
            <div className="skeleton skeleton-price-label"></div>
            <div className="skeleton skeleton-price-value"></div>
          </div>
          <div className="skeleton-price-divider">→</div>
          <div className="price-item-skeleton">
            <div className="skeleton skeleton-price-label"></div>
            <div className="skeleton skeleton-price-value"></div>
          </div>
        </div>

        {/* Profit */}
        <div className="product-profit-skeleton">
          <div className="skeleton skeleton-profit"></div>
        </div>

        {/* Description */}
        <div className="skeleton skeleton-description"></div>
      </div>
    </div>
  );
};

export default InventoryCardSkeleton;
