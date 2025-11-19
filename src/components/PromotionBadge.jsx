import './PromotionBadge.css';

const PromotionBadge = ({ promotion, discountAmount }) => {
  const { name, emoji, type } = promotion;

  const formatDiscount = () => {
    if (discountAmount) {
      return `-$${discountAmount.toFixed(2)}`;
    }
    return '';
  };

  return (
    <div className="promotion-badge">
      <span className="promotion-badge-emoji">{emoji || '🎉'}</span>
      <span className="promotion-badge-name">{name}</span>
      {discountAmount > 0 && (
        <span className="promotion-badge-discount">{formatDiscount()}</span>
      )}
    </div>
  );
};

export default PromotionBadge;
