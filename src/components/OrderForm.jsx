import { useState, useEffect } from 'react';
import ClientAutocomplete from './ClientAutocomplete';
import ShoePairItem from './ShoePairItem';
import OtherItem from './OtherItem';
import ImageUpload from './ImageUpload';
import PaymentScreen from './PaymentScreen';
import './OrderForm.css';

// Función para generar IDs únicos
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const OrderForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [cart, setCart] = useState([]); // Carrito de servicios seleccionados
  const [showPayment, setShowPayment] = useState(false); // Controla si se muestra el carrito o el pago
  const [showPaymentScreen, setShowPaymentScreen] = useState(false); // Controla si se muestra la pantalla de cobro
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado de envío con animación
  const [orderImages, setOrderImages] = useState([]); // Imágenes de la orden (array de URLs base64)

  // Estructura de datos simplificada con servicios
  const [formData, setFormData] = useState({
    client: '',
    phone: '',
    email: '',
    deliveryDate: '',
    priority: '',
    paymentMethod: 'pending',
    advancePayment: '',
    generalNotes: ''
  });

  const [errors, setErrors] = useState({});

  // Cargar servicios desde Firebase
  const [services, setServices] = useState([]);
  // Cargar productos desde Firebase
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const { subscribeToServices } = await import('../services/firebaseService');
        const unsubscribe = subscribeToServices((servicesData) => {
          // Agregar daysToAdd automáticamente basado en la duración
          const processedServices = servicesData.map(service => {
            // Extraer números de la duración (ej: "2-3 días" -> 3, "1 día" -> 1)
            const durationMatch = service.duration?.match(/(\d+)(?:-(\d+))?/);
            const daysToAdd = durationMatch ? parseInt(durationMatch[2] || durationMatch[1]) : 2;
            return {
              ...service,
              daysToAdd
            };
          });
          setServices(processedServices);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading services:', error);
      }
    };

    const loadProducts = async () => {
      try {
        const { subscribeToInventory } = await import('../services/firebaseService');
        const unsubscribe = subscribeToInventory((productsData) => {
          // Solo mostrar productos con stock disponible
          const availableProducts = productsData.filter(p => p.stock > 0);
          setProducts(availableProducts);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    loadServices();
    loadProducts();
  }, []);

  // Calcular precio total del carrito
  const calculateTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0);
  };

  // Calcular cantidad total de items (incluyendo cantidades)
  const calculateTotalItems = () => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  // Agregar servicio o producto al carrito
  const handleAddToCart = (item, type = 'service') => {
    setCart(prev => {
      if (type === 'service') {
        // Buscar si ya existe un item con el mismo servicio
        const existingItemIndex = prev.findIndex(i => i.type === 'service' && i.serviceName === item.name);

        if (existingItemIndex !== -1) {
          // Si existe, incrementar la cantidad
          const updatedCart = [...prev];
          updatedCart[existingItemIndex] = {
            ...updatedCart[existingItemIndex],
            quantity: (updatedCart[existingItemIndex].quantity || 1) + 1
          };
          return updatedCart;
        } else {
          // Si no existe, agregar nuevo servicio con cantidad 1
          const newItem = {
            id: generateId(),
            type: 'service',
            serviceName: item.name,
            price: item.price,
            icon: item.emoji || '🛠️',
            quantity: 1,
            daysToAdd: item.daysToAdd
          };
          return [...prev, newItem];
        }
      } else if (type === 'product') {
        // Buscar si ya existe un item con el mismo producto
        const existingItemIndex = prev.findIndex(i => i.type === 'product' && i.productId === item.id);

        if (existingItemIndex !== -1) {
          // Verificar que no exceda el stock disponible
          const currentQuantity = prev[existingItemIndex].quantity || 1;
          if (currentQuantity < item.stock) {
            // Si existe y hay stock, incrementar la cantidad
            const updatedCart = [...prev];
            updatedCart[existingItemIndex] = {
              ...updatedCart[existingItemIndex],
              quantity: currentQuantity + 1
            };
            return updatedCart;
          } else {
            // Stock insuficiente
            alert(`Stock insuficiente para ${item.name}. Disponible: ${item.stock}`);
            return prev;
          }
        } else {
          // Si no existe, agregar nuevo producto con cantidad 1
          const newItem = {
            id: generateId(),
            type: 'product',
            productId: item.id,
            name: item.name,
            price: item.salePrice,
            purchasePrice: item.purchasePrice,
            sku: item.sku,
            barcode: item.barcode,
            category: item.category,
            emoji: item.emoji,
            icon: item.emoji || '📦',
            quantity: 1,
            maxStock: item.stock
          };
          return [...prev, newItem];
        }
      }
      return prev;
    });
  };

  // Eliminar o decrementar item del carrito
  const handleRemoveFromCart = (itemId) => {
    setCart(prev => {
      const item = prev.find(i => i.id === itemId);

      if (item && item.quantity > 1) {
        // Si tiene más de 1, decrementar cantidad
        return prev.map(i =>
          i.id === itemId
            ? { ...i, quantity: i.quantity - 1 }
            : i
        );
      } else {
        // Si solo tiene 1, eliminar del carrito
        return prev.filter(i => i.id !== itemId);
      }
    });
  };

  // Cargar datos iniciales (para editar órdenes existentes)
  useEffect(() => {
    if (initialData) {
      setFormData({
        client: initialData.client || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        deliveryDate: initialData.deliveryDate || '',
        priority: initialData.priority || '',
        paymentMethod: initialData.paymentMethod || 'pending',
        advancePayment: initialData.advancePayment || '',
        generalNotes: initialData.generalNotes || ''
      });

      // Cargar servicios al carrito si existen
      if (initialData.services && initialData.services.length > 0) {
        setCart(initialData.services);
      }
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleClientInputChange = (e) => {
    setFormData(prev => ({ ...prev, client: e.target.value }));
    if (errors.client) {
      setErrors(prev => ({ ...prev, client: '' }));
    }
  };

  const handleSelectClient = (client) => {
    setFormData(prev => ({
      ...prev,
      client: client.name,
      phone: client.phone,
      email: client.email || ''
    }));
    setErrors(prev => ({ ...prev, client: '', phone: '' }));
  };

  // Validar datos básicos antes de ir a cobrar
  const validateBasicForm = () => {
    const newErrors = {};

    if (!formData.client.trim()) {
      newErrors.client = 'El nombre del cliente es requerido';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^[\d-]+$/.test(formData.phone)) {
      newErrors.phone = 'Formato de teléfono inválido';
    }
    if (cart.length === 0) {
      newErrors.cart = 'Debe agregar al menos un servicio al carrito';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validar formulario completo antes de enviar
  const validateForm = () => {
    const newErrors = {};

    if (!formData.deliveryDate) {
      newErrors.deliveryDate = 'La fecha de entrega es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler para mostrar la vista de pago
  const handleShowPayment = () => {
    if (validateBasicForm()) {
      setShowPayment(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Si el método de pago NO es pending, mostrar pantalla de cobro
      if (formData.paymentMethod !== 'pending') {
        setShowPaymentScreen(true);
      } else {
        // Flujo normal: crear orden directamente
        createOrder();
      }
    }
  };

  // Función para crear la orden (extraída para reutilizar)
  const createOrder = (paymentStatus = null, advancePayment = 0) => {
    setIsSubmitting(true);

    // Separar servicios y productos del carrito
    const serviceItems = cart.filter(item => item.type === 'service');
    const productItems = cart.filter(item => item.type === 'product');

    // Expandir servicios con cantidades a servicios individuales
    const services = serviceItems.flatMap(item => {
      const expandedServices = [];
      for (let i = 0; i < (item.quantity || 1); i++) {
        expandedServices.push({
          id: generateId(),
          serviceName: item.serviceName,
          price: item.price,
          icon: item.icon,
          images: [], // Servicios sin imágenes individuales
          notes: '',
          status: 'pending'
        });
      }
      return expandedServices;
    });

    // Transformar productos a formato de orden (con snapshot de datos)
    const products = productItems.map(item => ({
      id: generateId(),
      productId: item.productId,
      name: item.name,
      salePrice: item.price,
      purchasePrice: item.purchasePrice,
      sku: item.sku,
      barcode: item.barcode,
      category: item.category,
      emoji: item.emoji,
      quantity: item.quantity
    }));

    const orderData = {
      ...formData,
      services,
      products,
      orderImages: orderImages, // Imágenes a nivel de orden (ya en base64)
      totalPrice: calculateTotalPrice(),
      advancePayment: advancePayment,
      paymentStatus: paymentStatus || (formData.paymentMethod === 'pending' ? 'pending' : 'partial')
    };

    // Esperar 1.5s para mostrar animación antes de cerrar
    setTimeout(() => {
      onSubmit(orderData);
    }, 1500);
  };

  // Handler para cuando se confirma el cobro desde PaymentScreen
  const handlePaymentConfirm = (paymentData) => {
    // Cerrar pantalla de cobro y crear orden con datos de pago
    setShowPaymentScreen(false);
    createOrder(paymentData.paymentStatus, paymentData.advancePayment);
  };

  // Handler para cancelar desde PaymentScreen
  const handlePaymentCancel = () => {
    setShowPaymentScreen(false);
  };

  const handleMenuAction = (action) => {
    setShowMenu(false);

    switch(action) {
      case 'invoice':
        alert('Generar factura para ' + formData.client);
        break;
      case 'email':
        alert('Enviar correo a ' + formData.client + '\nSe seleccionará la plantilla según la etapa de la orden');
        break;
      case 'contact':
        const phone = formData.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}`, '_blank');
        break;
      case 'delete':
        if (confirm('¿Estás seguro de eliminar esta orden?')) {
          alert('Orden eliminada');
          onCancel();
        }
        break;
      default:
        break;
    }
  };

  // Auto-calcular fecha de entrega al seleccionar un servicio (solo basado en servicios)
  useEffect(() => {
    if (cart.length > 0 && !formData.deliveryDate) {
      // Filtrar solo servicios del carrito
      const serviceItems = cart.filter(item => item.type === 'service');

      if (serviceItems.length > 0) {
        const maxDays = Math.max(
          ...serviceItems.map(item => item.daysToAdd || 2)
        );

        const today = new Date();
        today.setDate(today.getDate() + maxDays);
        setFormData(prev => ({
          ...prev,
          deliveryDate: today.toISOString().split('T')[0]
        }));
      }
    }
  }, [cart, formData.deliveryDate]);

  return (
    <div className="order-form-container">
      {/* Animación de Éxito */}
      {isSubmitting && (
        <div className="success-overlay">
          <div className="success-animation">
            <div className="success-checkmark">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <h2 className="success-title">{initialData ? '¡Orden Actualizada!' : '¡Orden Creada!'}</h2>
            <p className="success-message">Procesando...</p>
          </div>
        </div>
      )}

      {/* Menu Button (only show when editing) */}
      {initialData && (
        <div className="order-menu-container">
          <button
            className="order-menu-button"
            onClick={() => setShowMenu(!showMenu)}
            type="button"
          >
            ⋮
          </button>
          {showMenu && (
            <div className="order-menu-dropdown">
              <button
                className="menu-item menu-invoice"
                onClick={() => handleMenuAction('invoice')}
                type="button"
              >
                <span className="menu-icon">🧾</span>
                <span className="menu-text">Generar Factura</span>
              </button>
              <button
                className="menu-item menu-email"
                onClick={() => handleMenuAction('email')}
                type="button"
              >
                <span className="menu-icon">📧</span>
                <span className="menu-text">Enviar Correo</span>
              </button>
              <button
                className="menu-item menu-contact"
                onClick={() => handleMenuAction('contact')}
                type="button"
              >
                <span className="menu-icon">💬</span>
                <span className="menu-text">Contactar WhatsApp</span>
              </button>
              <button
                className="menu-item menu-delete"
                onClick={() => handleMenuAction('delete')}
                type="button"
              >
                <span className="menu-icon">🗑️</span>
                <span className="menu-text">Eliminar Orden</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Renderizado condicional: PaymentScreen o Formulario */}
      {showPaymentScreen ? (
        <PaymentScreen
          services={cart.filter(item => item.type === 'service').flatMap(item => {
            const services = [];
            for (let i = 0; i < (item.quantity || 1); i++) {
              services.push({
                id: generateId(),
                serviceName: item.serviceName,
                price: item.price,
                icon: item.icon
              });
            }
            return services;
          })}
          products={cart.filter(item => item.type === 'product').map(item => ({
            id: item.id,
            name: item.name,
            salePrice: item.price,
            emoji: item.emoji,
            quantity: item.quantity
          }))}
          totalPrice={calculateTotalPrice()}
          advancePayment={0}
          paymentMethod={formData.paymentMethod}
          onConfirm={handlePaymentConfirm}
          onCancel={handlePaymentCancel}
        />
      ) : (
        <div className="order-form-layout">
        {/* Lado Izquierdo - Formulario con Flip */}
        <div className="order-form-left">
          <div className={`left-flip-container ${showPayment ? 'flipped' : ''}`}>
            {/* Frente - Información del Cliente y Servicios */}
            <div className="left-flip-front">
              <div className="form-section-header">
                <h3 className="step-title-large">Información del Cliente</h3>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Cliente <span className="required">*</span>
                  </label>
                  <ClientAutocomplete
                    value={formData.client}
                    onChange={handleClientInputChange}
                    onSelectClient={handleSelectClient}
                    error={errors.client}
                  />
                  {errors.client && <span className="error-message">{errors.client}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Teléfono <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className={`form-input ${errors.phone ? 'error' : ''}`}
                    placeholder="555-123-4567"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
              </div>

              <div className="form-section-header">
                <h3 className="step-title-large">Servicios Disponibles</h3>
              </div>

              <div className="order-services-grid">
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    className="service-icon-button"
                    onClick={() => handleAddToCart(service, 'service')}
                    title={`${service.name} - $${service.price}`}
                  >
                    <span className="service-icon-large">{service.emoji || '🛠️'}</span>
                  </button>
                ))}
              </div>

              <div className="form-section-header" style={{ marginTop: '24px' }}>
                <h3 className="step-title-large">Productos Disponibles</h3>
              </div>

              <div className="order-services-grid">
                {products.length === 0 ? (
                  <div className="empty-products">
                    <span className="empty-icon">📦</span>
                    <p>No hay productos disponibles en inventario</p>
                  </div>
                ) : (
                  products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="service-icon-button"
                      onClick={() => handleAddToCart(product, 'product')}
                      title={`${product.name} - $${product.salePrice} (Stock: ${product.stock})`}
                    >
                      <span className="service-icon-large">{product.emoji || '📦'}</span>
                      {product.stock <= product.minStock && (
                        <span className="stock-warning">⚠️</span>
                      )}
                    </button>
                  ))
                )}
              </div>
              {errors.cart && <span className="error-message">{errors.cart}</span>}
            </div>

            {/* Reverso - Subir Fotos */}
            <div className="left-flip-back">
              <div className="form-section-header">
                <h3 className="step-title-large">📸 Fotos de la Orden</h3>
              </div>

              <div className="photo-upload-section">
                <ImageUpload
                  images={orderImages}
                  onChange={setOrderImages}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho - Carrito con Flip */}
        <div className="order-cart-sidebar">
          <div className={`cart-flip-container ${showPayment ? 'flipped' : ''}`}>
            {/* Frente - Carrito */}
            <div className="cart-flip-front">
              <div className="cart-header">
                <h3>🛒 Carrito</h3>
                <span className="cart-count">{calculateTotalItems()} items</span>
              </div>

              <div className="cart-items">
                {cart.length === 0 ? (
                  <div className="cart-empty">
                    <span className="empty-icon">🛒</span>
                    <p>No hay items agregados</p>
                    <p className="empty-hint">Presiona los iconos de servicios o productos para agregarlos</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-icon">{item.icon}</div>
                      <div className="cart-item-info">
                        <span className="cart-item-name">
                          {item.type === 'service' ? item.serviceName : item.name}
                          {item.quantity > 1 && (
                            <span className="cart-item-quantity"> x{item.quantity}</span>
                          )}
                        </span>
                        <span className="cart-item-price">
                          ${item.price}
                          {item.quantity > 1 && (
                            <span className="cart-item-subtotal"> = ${item.price * item.quantity}</span>
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="cart-item-remove"
                        onClick={() => handleRemoveFromCart(item.id)}
                        title={item.quantity > 1 ? "Reducir cantidad" : "Eliminar"}
                      >
                        {item.quantity > 1 ? '−' : '✕'}
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="cart-summary">
                <div className="cart-total">
                  <span className="total-label">Total:</span>
                  <span className="total-value">${calculateTotalPrice()}</span>
                </div>
              </div>

              <div className="cart-actions">
                <button type="button" className="btn-secondary" onClick={onCancel}>
                  Cancelar
                </button>
                <button type="button" className="btn-primary" onClick={handleShowPayment}>
                  💳 Cobrar
                </button>
              </div>
            </div>

            {/* Reverso - Pago */}
            <div className="cart-flip-back">
              <div className="cart-header">
                <button
                  type="button"
                  className="btn-back"
                  onClick={() => setShowPayment(false)}
                >
                  ← Volver
                </button>
                <h3>💰 Pago</h3>
              </div>

              <div className="payment-form">
                <div className="payment-summary-box">
                  <div className="payment-total">
                    <span>Total a cobrar:</span>
                    <span className="payment-amount">${calculateTotalPrice()}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Fecha de Entrega <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="deliveryDate"
                    className={`form-input ${errors.deliveryDate ? 'error' : ''}`}
                    value={formData.deliveryDate}
                    onChange={handleChange}
                  />
                  {errors.deliveryDate && <span className="error-message">{errors.deliveryDate}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Prioridad</label>
                  <select
                    name="priority"
                    className="form-input"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value="">Normal</option>
                    <option value="high">Alta 🔥</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Método de Pago</label>
                  <div className="payment-methods-compact">
                    <button
                      type="button"
                      className={`payment-method-btn ${formData.paymentMethod === 'cash' ? 'selected' : ''}`}
                      onClick={() => handleChange({ target: { name: 'paymentMethod', value: 'cash' } })}
                    >
                      💵 Efectivo
                    </button>
                    <button
                      type="button"
                      className={`payment-method-btn ${formData.paymentMethod === 'card' ? 'selected' : ''}`}
                      onClick={() => handleChange({ target: { name: 'paymentMethod', value: 'card' } })}
                    >
                      💳 Tarjeta
                    </button>
                    <button
                      type="button"
                      className={`payment-method-btn ${formData.paymentMethod === 'transfer' ? 'selected' : ''}`}
                      onClick={() => handleChange({ target: { name: 'paymentMethod', value: 'transfer' } })}
                    >
                      📱 Transfer
                    </button>
                    <button
                      type="button"
                      className={`payment-method-btn ${formData.paymentMethod === 'pending' ? 'selected' : ''}`}
                      onClick={() => handleChange({ target: { name: 'paymentMethod', value: 'pending' } })}
                    >
                      ⏳ Pendiente
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notas generales</label>
                  <textarea
                    name="generalNotes"
                    className="form-input form-textarea"
                    placeholder="Notas generales de la orden..."
                    rows="2"
                    value={formData.generalNotes}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="cart-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPayment(false)}>
                  ← Volver al Carrito
                </button>
                <button type="button" className="btn-primary" onClick={handleSubmit}>
                  {initialData ? '💾 Guardar' : '✨ Crear Orden'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

    </div>
  );
};

export default OrderForm;
