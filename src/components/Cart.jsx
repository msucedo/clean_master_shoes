import { useState, useEffect, useRef } from 'react';
import { useCart } from '../hooks/useCart';
import { useInventory } from '../hooks/useInventory';
import CartPayment from './CartPayment';
import { createSale, addSalePrintRecord } from '../services/salesService';
import { printTicket } from '../services/printService';
import { addPrintJob } from '../services/printQueueService';
import { getPrinterMethodPreference, PRINTER_METHODS } from '../utils/printerConfig';
import { useNotification } from '../contexts/NotificationContext';
import './Cart.css';

const Cart = () => {
  const { showSuccess, showError } = useNotification();
  const { data: products = [] } = useInventory();
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    notes,
    setNotes,
    discount,
    discountType,
    applyDiscount,
    removeProduct,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    subtotal,
    discountAmount,
    total,
    itemCount,
    canCheckout,
    selectedClient,
    setSelectedClient,
    addProductWithValidation
  } = useCart();

  const [showPayment, setShowPayment] = useState(false);
  const [paymentAnimating, setPaymentAnimating] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [discountTypeInput, setDiscountTypeInput] = useState('amount');
  const [isProcessing, setIsProcessing] = useState(false);
  const [barcodeSearch, setBarcodeSearch] = useState('');

  // Ref para el search bar del carrito
  const cartSearchInputRef = useRef(null);

  // Ref para prevenir impresiones duplicadas
  const isPrintingRef = useRef(false);

  const handleClose = () => {
    setIsCartOpen(false);
  };

  const handleApplyDiscount = () => {
    const value = parseFloat(discountInput) || 0;
    applyDiscount(value, discountTypeInput);
  };

  const handleClearCart = () => {
    clearCart();
  };

  const handleProceedToPayment = () => {
    const validation = canCheckout();
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    // Ocultar carrito y mostrar payment
    setShowPayment(true); // Cart se oculta con payment-active
    setPaymentAnimating(true); // Payment aparece con visible
  };

  const handlePaymentConfirm = async (paymentData) => {
    setIsProcessing(true);
    try {
      // Preparar datos de la venta
      const saleData = {
        items: cartItems,
        subtotal: subtotal,
        discount: discount,
        discountType: discountType,
        discountAmount: discountAmount,
        total: total,
        paymentMethod: paymentData.paymentMethod,
        paymentStatus: paymentData.paymentStatus || 'paid',
        amountReceived: paymentData.amountReceived || total,
        change: paymentData.change || 0,
        clientId: selectedClient?.id || null,
        clientName: selectedClient?.name || null,
        notes: notes,
        createdAt: new Date().toISOString()
      };

      // Crear la venta en Firebase (esto también actualiza el inventario)
      const saleId = await createSale(saleData);

      showSuccess(`Venta completada exitosamente. ID: ${saleId.substring(0, 8)}`);

      // ========== IMPRESIÓN ==========
      // Obtener preferencia del usuario
      const userPreference = getPrinterMethodPreference();
      const shouldUseQueue = userPreference === PRINTER_METHODS.QUEUE || userPreference === 'queue';
      const shouldAutoprint = userPreference === PRINTER_METHODS.BLUETOOTH || userPreference === 'bluetooth';

      // FLUJO 1: Si usuario eligió "Impresión Remota en Cola": enviar automáticamente
      if (shouldUseQueue) {
        try {
          await addPrintJob(saleId, saleId.substring(0, 8), 'sale');
          console.log('✅ Ticket de venta enviado a cola de impresión');
        } catch (error) {
          console.error('Error al enviar ticket de venta a cola:', error);
          // No bloquear el flujo si falla el envío a cola
        }
      }

      // FLUJO 2: Si método es Bluetooth: auto-imprimir (silencioso, reconexión automática)
      if (shouldAutoprint && !isPrintingRef.current) {
        isPrintingRef.current = true;
        try {
          const printResult = await printTicket(saleData, 'sale', {
            method: 'bluetooth',
            allowFallback: false
          });

          if (printResult.success) {
            console.log('✅ Ticket de venta auto-impreso:', printResult.deviceName);

            // Registrar en historial de impresiones
            try {
              const printData = {
                type: 'sale',
                printedAt: new Date().toISOString(),
                printedBy: 'auto',
                deviceInfo: printResult.method === 'bluetooth'
                  ? `Bluetooth (${printResult.deviceName || 'Impresora'})`
                  : 'Desktop'
              };
              await addSalePrintRecord(saleId, printData);
            } catch (recordError) {
              console.warn('⚠️ Error al registrar impresión:', recordError.message);
            }
          } else if (!printResult.cancelled) {
            console.warn('⚠️ Auto-impresión de ticket de venta falló:', printResult.error);
          }
        } catch (error) {
          console.warn('⚠️ Error en auto-impresión de ticket de venta:', error.message);
          // No mostrar error al usuario - es proceso background
        } finally {
          isPrintingRef.current = false;
        }
      }

      // Limpiar el carrito y cerrar
      clearCart();
      setShowPayment(false);
      setPaymentAnimating(false);
      setIsCartOpen(false);
    } catch (error) {
      console.error('Error al procesar la venta:', error);
      showError(error.message || 'Error al procesar la venta. Por favor intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentCancel = () => {
    // Iniciar animación de salida del payment
    setPaymentAnimating(false);

    // Esperar a que termine la animación del payment (1s) antes de mostrar el carrito
    setTimeout(() => {
      setShowPayment(false);
    }, 1000); // duración completa de la animación del CartPayment
  };

  // Focus automático en search bar del carrito después de agregar productos
  useEffect(() => {
    if (isCartOpen && cartItems.length > 0 && cartSearchInputRef.current) {
      // Pequeño delay para que la animación de apertura termine
      setTimeout(() => {
        cartSearchInputRef.current?.focus();
      }, 300);
    }
  }, [isCartOpen, cartItems.length]);

  // Detectar tecla ESC para cerrar el carrito
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isCartOpen && !showPayment) {
        event.preventDefault();
        handleEscapePress();
      }
    };

    window.addEventListener('keydown', handleEscKey);

    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isCartOpen, cartItems.length, showPayment]);

  // Manejar presión de tecla ESC
  const handleEscapePress = () => {
    // Si el carrito está vacío, solo cerrarlo
    if (cartItems.length === 0) {
      setIsCartOpen(false);
      return;
    }

    // Si tiene productos, preguntar qué hacer
    const message =
      `Tienes ${itemCount} producto${itemCount > 1 ? 's' : ''} en el carrito.\n\n` +
      `• ACEPTAR: Solo cerrar (mantener productos)\n` +
      `• CANCELAR: Vaciar carrito y cerrar`;

    const soloCerrar = window.confirm(message);

    if (soloCerrar) {
      // Solo cerrar, mantener productos
      setIsCartOpen(false);
    } else {
      // Vaciar y cerrar
      clearCart();
    }
  };

  // Buscar y agregar producto por código de barras desde el carrito
  const handleBarcodeSearch = (e) => {
    if (e.key === 'Enter' && barcodeSearch.trim()) {
      // Buscar producto por código de barras
      const productByBarcode = products.find(
        p => p.barcode && p.barcode.toLowerCase() === barcodeSearch.trim().toLowerCase()
      );

      if (productByBarcode) {
        // Agregar al carrito
        const success = addProductWithValidation(productByBarcode, 1);
        if (success) {
          setBarcodeSearch(''); // Limpiar el campo de búsqueda
        }
      } else {
        showError('No se encontró ningún producto con ese código');
      }
    }
  };

  return (
    <>
      {/* Overlay oscuro */}
      {isCartOpen && <div className="cart-overlay" onClick={handleClose}></div>}

      {/* Drawer del carrito */}
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''} ${paymentAnimating ? 'payment-active' : ''}`}>
        {/* Header */}
        <div className="cart-header">
          <div className="cart-header-top">
            <h2 className="cart-title">
              Carrito {itemCount > 0 && `(${itemCount})`}
            </h2>
            <button className="cart-close-btn" onClick={handleClose}>
              ✕
            </button>
          </div>

          {/* Search bar para escanear productos */}
          <div className="cart-search-bar">
            <input
              ref={cartSearchInputRef}
              type="text"
              className="cart-search-input"
              placeholder="Escanear código de barras..."
              value={barcodeSearch}
              onChange={(e) => setBarcodeSearch(e.target.value)}
              onKeyPress={handleBarcodeSearch}
            />
          </div>
        </div>

        {/* Contenido del carrito */}
        <div className="cart-content">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <p>El carrito está vacío</p>
              <p className="cart-empty-hint">Escanea un código de barras para agregar productos</p>
            </div>
          ) : (
            <>
              {/* Lista de productos - Tabla Compacta */}
              <div className="cart-items-compact">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item-row">
                    <span className="item-emoji">{item.emoji}</span>
                    <span className="item-name">{item.name}</span>
                    <span className="item-price">${item.salePrice.toFixed(2)}</span>
                    <div className="item-qty-controls">
                      <button
                        className="qty-btn-compact"
                        onClick={() => decrementQuantity(item.id)}
                      >
                        −
                      </button>
                      <span className="qty-num">{item.quantity}</span>
                      <button
                        className="qty-btn-compact"
                        onClick={() => incrementQuantity(item.id)}
                      >
                        +
                      </button>
                    </div>
                    <span className="item-subtotal">${(item.salePrice * item.quantity).toFixed(2)}</span>
                    <button
                      className="item-remove-btn"
                      onClick={() => removeProduct(item.id)}
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Sección de descuento - Compacta */}
              <div className="cart-discount-compact">
                <input
                  type="number"
                  className="discount-input-compact"
                  placeholder="Descuento"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  min="0"
                />
                <select
                  className="discount-type-compact"
                  value={discountTypeInput}
                  onChange={(e) => setDiscountTypeInput(e.target.value)}
                >
                  <option value="amount">$</option>
                  <option value="percentage">%</option>
                </select>
                <button
                  className="discount-btn-compact"
                  onClick={handleApplyDiscount}
                >
                  Aplicar
                </button>
                {discount > 0 && (
                  <span className="discount-badge">
                    -{discountType === 'percentage' ? `${discount}%` : `$${discount.toFixed(2)}`}
                  </span>
                )}
              </div>

              {/* Sección de notas - Compacta */}
              <div className="cart-notes-compact">
                <textarea
                  className="cart-notes-input-compact"
                  placeholder="Notas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={1}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer con totales y botones */}
        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="summary-row discount-row">
                  <span>Descuento:</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row total-row">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="cart-actions">
              <button
                className="btn-clear-cart"
                onClick={handleClearCart}
                disabled={isProcessing}
              >
                Vaciar Carrito
              </button>
              <button
                className="btn-checkout"
                onClick={handleProceedToPayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Procesando...' : 'Proceder al Pago'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cart Payment Screen - Slide desde la derecha */}
      <CartPayment
        className={paymentAnimating ? 'visible' : ''}
        isVisible={paymentAnimating}
        cartItems={cartItems}
        subtotal={subtotal}
        discountAmount={discountAmount}
        total={total}
        onConfirm={handlePaymentConfirm}
        onCancel={handlePaymentCancel}
      />
    </>
  );
};

export default Cart;
