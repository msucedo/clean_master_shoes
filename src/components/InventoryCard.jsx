import './InventoryCard.css';

const InventoryCard = ({ product, onClick }) => {
  const isLowStock = product.stock <= product.minStock;
  const profit = product.salePrice - product.purchasePrice;
  const profitPercentage = product.purchasePrice > 0
    ? ((profit / product.purchasePrice) * 100).toFixed(1)
    : 0;

  // Get the first image or use a placeholder
  const productImage = product.images && product.images.length > 0
    ? product.images[0]
    : null;

  const getCategoryIcon = (category) => {
    const icons = {
      'Tenis': '👟',
      'Zapatos': '👞',
      'Botas': '🥾',
      'Accesorios': '🎒',
      'Gorras': '🧢',
      'Bolsas': '👜'
    };
    return icons[category] || '📦';
  };

  // Get the emoji to display: custom emoji > category icon
  const displayEmoji = product.emoji || getCategoryIcon(product.category);

  return (
    <div className="inventory-card" onClick={() => onClick && onClick(product)}>
      {/* Product Image */}
      <div className="product-image-container">
        {productImage ? (
          <img src={productImage} alt={product.name} className="product-image" />
        ) : (
          <div className="product-image-placeholder">
            {displayEmoji}
          </div>
        )}
        <div className="product-category-badge">
          {displayEmoji} {product.category}
        </div>
      </div>

      {/* Product Info */}
      <div className="product-info">
        <div className="product-header">
          <h3 className="product-name">{product.name}</h3>
          {product.barcode && (
            <div className="product-codes">
              <span className="product-barcode" title="Código de Barras">
                📊 {product.barcode}
              </span>
            </div>
          )}
        </div>

        {/* Stock Section */}
        <div className="product-stock-section">
          <div className={`stock-badge ${isLowStock ? 'low-stock' : 'normal-stock'}`}>
            {isLowStock ? '⚠️' : '✓'} Stock: {product.stock}
            {isLowStock && ` (Mín: ${product.minStock})`}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="product-pricing">
          <div className="price-item">
            <span className="price-label">Compra</span>
            <span className="price-value">${product.purchasePrice.toFixed(2)}</span>
          </div>
          <div className="price-divider">→</div>
          <div className="price-item">
            <span className="price-label">Venta</span>
            <span className="price-value sale-price">${product.salePrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Profit Display */}
        <div className="product-profit">
          <span className="profit-label">Ganancia:</span>
          <span className={`profit-amount ${profit >= 0 ? 'positive' : 'negative'}`}>
            ${profit.toFixed(2)} ({profitPercentage}%)
          </span>
        </div>

        {/* Description */}
        {product.description && (
          <div className="product-description">
            {product.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryCard;
