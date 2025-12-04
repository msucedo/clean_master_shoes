import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './CartPayment.css';

const CartPayment = ({
  cartItems = [],
  subtotal = 0,
  discountAmount = 0,
  total = 0,
  onConfirm,
  onCancel,
  className = '',
  isVisible = false
}) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Resetear estado cuando se abre el payment screen
  useEffect(() => {
    if (isVisible) {
      setPaymentMethod('cash');
      setAmountReceived('');
      setChange(0);
      setIsProcessing(false);
    }
  }, [isVisible]);

  // Calcular cambio cuando cambia el monto recibido
  useEffect(() => {
    if (paymentMethod === 'cash' && amountReceived) {
      const received = parseFloat(amountReceived) || 0;
      const calculatedChange = received - total;
      setChange(calculatedChange >= 0 ? calculatedChange : 0);
    } else {
      setChange(0);
    }
  }, [amountReceived, total, paymentMethod]);

  // Auto-fill amount received con el total si no es efectivo
  useEffect(() => {
    if (paymentMethod !== 'cash') {
      setAmountReceived(total.toString());
    }
  }, [paymentMethod, total]);

  const handleConfirm = async () => {
    // Validaciones para método de pago en efectivo
    if (paymentMethod === 'cash') {
      const received = parseFloat(amountReceived) || 0;

      // Validación 1: Debe ingresar un monto
      if (received <= 0) {
        alert('Debe ingresar el monto recibido');
        return;
      }

      // Validación 2: Monto debe cubrir el total (ventas siempre son pago completo)
      if (received < total) {
        alert(
          `Monto insuficiente. Debe pagar el total.\n\n` +
          `Total a pagar: $${total.toFixed(2)}\n` +
          `Recibido: $${received.toFixed(2)}\n` +
          `Falta: $${(total - received).toFixed(2)}`
        );
        return;
      }
    }

    setIsProcessing(true);

    const paymentData = {
      paymentMethod,
      paymentStatus: 'paid',
      amountReceived: parseFloat(amountReceived) || total,
      change: change
    };

    try {
      await onConfirm(paymentData);
    } catch (error) {
      console.error('Error en pago:', error);
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (!isProcessing) {
      onCancel();
    }
  };

  return (
    <div className={`cart-payment ${className}`}>
      {/* Header */}
      <div className="cart-payment-header">
        <div className="cart-payment-header-top">
          <h2 className="cart-payment-title">Confirmar Pago</h2>
          <button
            className="cart-payment-close-btn"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="cart-payment-content">
        {/* Resumen de Productos */}
        <div className="cart-payment-section">
          <h3 className="section-title">Resumen de Compra</h3>
          <div className="cart-payment-items">
            {cartItems.map((item) => (
              <div key={item.id} className="payment-item-row">
                <span className="payment-item-emoji">{item.emoji}</span>
                <span className="payment-item-name">{item.name}</span>
                <span className="payment-item-qty">x{item.quantity}</span>
                <span className="payment-item-subtotal">
                  ${(item.salePrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totales */}
        <div className="cart-payment-section">
          <div className="payment-summary">
            <div className="payment-summary-row">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="payment-summary-row discount">
                <span>Descuento:</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="payment-summary-row total">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Método de Pago */}
        <div className="cart-payment-section">
          <h3 className="section-title">Método de Pago</h3>
          <div className="payment-methods">
            <button
              className={`payment-method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('cash')}
              disabled={isProcessing}
            >
              💵 Efectivo
            </button>
            <button
              className={`payment-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('card')}
              disabled={isProcessing}
            >
              💳 Tarjeta
            </button>
            <button
              className={`payment-method-btn ${paymentMethod === 'transfer' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('transfer')}
              disabled={isProcessing}
            >
              📱 Transferencia
            </button>
          </div>
        </div>

        {/* Monto Recibido (solo efectivo) */}
        {paymentMethod === 'cash' && (
          <div className="cart-payment-section">
            <h3 className="section-title">Monto Recibido</h3>
            <input
              type="number"
              className="payment-input"
              placeholder="Ingrese el monto recibido..."
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              min="0"
              step="0.01"
              disabled={isProcessing}
            />
            {amountReceived && (
              <div className="change-display">
                <span>Cambio:</span>
                <span className={change >= 0 ? 'positive' : 'negative'}>
                  ${change.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer con botones */}
      <div className="cart-payment-footer">
        <button
          className="btn-payment-cancel"
          onClick={handleCancel}
          disabled={isProcessing}
        >
          Cancelar
        </button>
        <button
          className="btn-payment-confirm"
          onClick={handleConfirm}
          disabled={isProcessing}
        >
          {isProcessing ? 'Procesando...' : 'Confirmar Venta'}
        </button>
      </div>
    </div>
  );
};

CartPayment.propTypes = {
  cartItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      emoji: PropTypes.string,
      quantity: PropTypes.number.isRequired,
      salePrice: PropTypes.number.isRequired
    })
  ).isRequired,
  subtotal: PropTypes.number.isRequired,
  discountAmount: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  className: PropTypes.string,
  isVisible: PropTypes.bool
};

export default CartPayment;
