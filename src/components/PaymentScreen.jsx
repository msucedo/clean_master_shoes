import { useState, useMemo } from 'react';
import './PaymentScreen.css';

const PaymentScreen = ({ services = [], products = [], totalPrice = 0, advancePayment = 0, paymentMethod = 'cash', allowEditMethod = false, onConfirm, onCancel }) => {
  const [amountReceived, setAmountReceived] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(paymentMethod);

  // Calcular total
  const subtotal = useMemo(() => {
    const servicesTotal = services.reduce((sum, service) => sum + (service.price || 0), 0);
    const productsTotal = products.reduce((sum, product) => sum + ((product.salePrice || 0) * (product.quantity || 1)), 0);
    return servicesTotal + productsTotal;
  }, [services, products]);

  // Saldo restante a cobrar (después de anticipo)
  const remainingBalance = useMemo(() => subtotal - advancePayment, [subtotal, advancePayment]);

  // Calcular cambio (solo si es efectivo)
  const change = useMemo(() => {
    if (selectedMethod !== 'cash') return 0;
    const received = parseFloat(amountReceived) || 0;
    const changeAmount = received - remainingBalance;
    return changeAmount > 0 ? changeAmount : 0;
  }, [selectedMethod, amountReceived, remainingBalance]);

  const handleConfirm = () => {
    // Lógica para método de pago en efectivo
    if (selectedMethod === 'cash') {
      const received = parseFloat(amountReceived) || 0;

      // Si hay anticipo previo (cobro en entrega), validar monto suficiente
      if (advancePayment > 0 && received < remainingBalance) {
        alert(`Monto insuficiente. Falta: $${(remainingBalance - received).toFixed(2)}`);
        return;
      }

      // Si es orden nueva (advancePayment === 0), permitir pago parcial
      if (advancePayment === 0) {
        if (received <= 0) {
          alert('Debe ingresar un monto mayor a $0');
          return;
        }

        // Determinar si es pago parcial o completo
        if (received < remainingBalance) {
          // Pago parcial - usar como anticipo
          onConfirm({
            amountReceived: received,
            change: 0,
            paymentMethod: selectedMethod,
            advancePayment: received,
            paymentStatus: 'partial'
          });
          return;
        } else {
          // Pago completo o con cambio
          onConfirm({
            amountReceived: received,
            change: received - remainingBalance,
            paymentMethod: selectedMethod,
            advancePayment: remainingBalance,
            paymentStatus: 'paid'
          });
          return;
        }
      }
    }

    // Para otros métodos o flujo normal de cobro en entrega
    onConfirm({
      amountReceived: selectedMethod === 'cash' ? parseFloat(amountReceived) : remainingBalance,
      change: change,
      paymentMethod: selectedMethod,
      advancePayment: remainingBalance,
      paymentStatus: 'paid'
    });
  };

  return (
    <div className="payment-screen">
      <div className="payment-header">
        <h2 className="payment-title">💰 Confirmar Cobro</h2>
        <p className="payment-subtitle">Revisa el desglose y confirma el pago</p>
      </div>

      <div className="payment-content">
        {/* Desglose de Servicios */}
        {services.length > 0 && (
          <div className="payment-section">
            <h3 className="section-header">🧼 Servicios</h3>
            <div className="items-list">
              {services.map((service, index) => (
                <div key={service.id || index} className="item-row">
                  <span className="item-icon">{service.icon}</span>
                  <span className="item-name">{service.serviceName}</span>
                  <span className="item-price">${service.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Desglose de Productos */}
        {products.length > 0 && (
          <div className="payment-section">
            <h3 className="section-header">📦 Productos</h3>
            <div className="items-list">
              {products.map((product, index) => (
                <div key={product.id || index} className="item-row">
                  <span className="item-icon">{product.emoji || '📦'}</span>
                  <span className="item-name">
                    {product.name} <span className="item-quantity">x{product.quantity}</span>
                  </span>
                  <span className="item-price">${product.salePrice * product.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen de Totales */}
        <div className="payment-summary">
          <div className="summary-row total-row">
            <span className="summary-label">Total:</span>
            <span className="summary-value total-value">${subtotal.toFixed(2)}</span>
          </div>

          {advancePayment > 0 && (
            <>
              <div className="summary-row advance-row">
                <span className="summary-label">Anticipo:</span>
                <span className="summary-value">-${advancePayment.toFixed(2)}</span>
              </div>
              <div className="summary-row remaining-row">
                <span className="summary-label">Saldo Restante:</span>
                <span className="summary-value remaining-value">${remainingBalance.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {/* Campo de Monto Recibido (solo efectivo) */}
        {selectedMethod === 'cash' && (
          <div className="cash-payment-section">
            <div className="cash-input-group">
              <label className="cash-label">💵 Monto Recibido:</label>
              <input
                type="number"
                className="cash-input"
                placeholder="0.00"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                step="0.01"
                min="0"
                autoFocus
              />
            </div>

            {change > 0 && (
              <div className="change-display">
                <span className="change-label">Cambio:</span>
                <span className="change-value">${change.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Método de pago - Editable o Read-only */}
        {allowEditMethod ? (
          <div className="payment-section">
            <h3 className="section-header">Método de Pago</h3>
            <div className="payment-methods-grid">
              <button
                type="button"
                className={`payment-method-btn ${selectedMethod === 'cash' ? 'selected' : ''}`}
                onClick={() => setSelectedMethod('cash')}
              >
                💵 Efectivo
              </button>
              <button
                type="button"
                className={`payment-method-btn ${selectedMethod === 'card' ? 'selected' : ''}`}
                onClick={() => setSelectedMethod('card')}
              >
                💳 Tarjeta
              </button>
              <button
                type="button"
                className={`payment-method-btn ${selectedMethod === 'transfer' ? 'selected' : ''}`}
                onClick={() => setSelectedMethod('transfer')}
              >
                📱 Transfer
              </button>
              <button
                type="button"
                className={`payment-method-btn ${selectedMethod === 'pending' ? 'selected' : ''}`}
                onClick={() => setSelectedMethod('pending')}
              >
                ⏳ Pendiente
              </button>
            </div>
          </div>
        ) : (
          <div className="payment-method-info">
            <span className="method-label">Método de Pago:</span>
            <span className="method-value">
              {selectedMethod === 'cash' && '💵 Efectivo'}
              {selectedMethod === 'card' && '💳 Tarjeta'}
              {selectedMethod === 'transfer' && '📱 Transferencia'}
              {selectedMethod === 'pending' && '⏳ Pendiente'}
            </span>
          </div>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="payment-actions">
        <button type="button" className="btn-cancel-payment" onClick={onCancel}>
          ✕ Cancelar
        </button>
        <button type="button" className="btn-confirm-payment" onClick={handleConfirm}>
          ✓ Confirmar Cobro
        </button>
      </div>
    </div>
  );
};

export default PaymentScreen;
