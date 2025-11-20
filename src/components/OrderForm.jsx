import { useState, useEffect } from 'react';
import ClientAutocomplete from './ClientAutocomplete';
import ShoePairItem from './ShoePairItem';
import OtherItem from './OtherItem';
import ImageUpload from './ImageUpload';
import PaymentScreen from './PaymentScreen';
import VariablePriceModal from './VariablePriceModal';
import DeliveryCalendarModal from './DeliveryCalendarModal';
import PromotionBadge from './PromotionBadge';
import './OrderForm.css';

// Función para generar IDs únicos
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const OrderForm = ({ onSubmit, onCancel, initialData = null, employees = [], allOrders = {} }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [cart, setCart] = useState([]); // Carrito de servicios seleccionados
  const [showPayment, setShowPayment] = useState(false); // Controla si se muestra el carrito o el pago
  const [showPaymentScreen, setShowPaymentScreen] = useState(false); // Controla si se muestra la pantalla de cobro
  const [showVariablePriceModal, setShowVariablePriceModal] = useState(false); // Controla modal de precios variables
  const [variablePriceServices, setVariablePriceServices] = useState([]); // Servicios con precio por definir
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado de envío con animación
  const [orderImages, setOrderImages] = useState([]); // Imágenes de la orden (array de URLs base64)
  const [selectedEmployee, setSelectedEmployee] = useState(null); // Empleado seleccionado para asignación automática
  const [showCalendarModal, setShowCalendarModal] = useState(false); // Controla modal de calendario de entregas
  const [requireFullPayment, setRequireFullPayment] = useState(false); // Requiere pago completo para órdenes sin servicios

  // Estructura de datos simplificada con servicios
  const [formData, setFormData] = useState({
    client: '',
    phone: '',
    email: '',
    deliveryDate: '',
    paymentMethod: 'pending',
    advancePayment: '',
    generalNotes: ''
  });

  const [errors, setErrors] = useState({});

  // Cargar servicios desde Firebase
  const [services, setServices] = useState([]);
  // Cargar productos desde Firebase
  const [products, setProducts] = useState([]);
  // Cargar promociones activas
  const [activePromotions, setActivePromotions] = useState([]);
  // Promociones aplicadas al carrito actual
  const [appliedPromotions, setAppliedPromotions] = useState([]);

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

    const loadPromotions = async () => {
      try {
        const { getActivePromotions } = await import('../services/firebaseService');
        const promotions = await getActivePromotions();
        setActivePromotions(promotions);
      } catch (error) {
        console.error('Error loading promotions:', error);
      }
    };

    loadServices();
    loadProducts();
    loadPromotions();
  }, []);

  // Calcular precio total del carrito (con descuentos aplicados)
  const calculateTotalPrice = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateTotalDiscount();
    return Math.max(0, subtotal - discount);
  };

  // Calcular cantidad total de items (incluyendo cantidades)
  const calculateTotalItems = () => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  // Calcular subtotal (antes de descuentos)
  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0);
  };

  // Calcular total de descuentos
  const calculateTotalDiscount = () => {
    return appliedPromotions.reduce((total, promo) => total + (promo.discountAmount || 0), 0);
  };

  // Validar y calcular promociones aplicables
  const checkApplicablePromotions = async () => {
    if (cart.length === 0 || activePromotions.length === 0) {
      setAppliedPromotions([]);
      return;
    }

    const { validatePromotion } = await import('../services/firebaseService');
    const subtotal = calculateSubtotal();
    const clientPhone = formData.phone;

    const validPromotions = [];

    for (const promotion of activePromotions) {
      const result = await validatePromotion(promotion, cart, clientPhone, subtotal);

      if (result.isValid && result.discountAmount > 0) {
        validPromotions.push({
          ...promotion,
          discountAmount: result.discountAmount
        });
      }
    }

    setAppliedPromotions(validPromotions);
  };

  // Recalcular promociones cuando cambie el carrito o el cliente
  useEffect(() => {
    checkApplicablePromotions();
  }, [cart, formData.phone, activePromotions]);

  // Calcular número de órdenes activas por empleado (recibidos + proceso)
  const getEmployeeOrderCount = (employeeName) => {
    const recibidos = allOrders.recibidos || [];
    const proceso = allOrders.proceso || [];

    const activeOrders = [...recibidos, ...proceso];
    return activeOrders.filter(order => order.author === employeeName).length;
  };

  // Obtener empleados con su conteo de órdenes, ordenados por menos órdenes
  const getEmployeesWithOrderCount = () => {
    return employees.map(emp => ({
      ...emp,
      orderCount: getEmployeeOrderCount(emp.name)
    })).sort((a, b) => a.orderCount - b.orderCount);
  };

  // Auto-seleccionar empleado con menos órdenes cuando hay empleados disponibles
  useEffect(() => {
    if (employees.length > 0 && selectedEmployee === null) {
      const employeesWithCount = getEmployeesWithOrderCount();
      if (employeesWithCount.length > 0) {
        setSelectedEmployee(employeesWithCount[0]);
      }
    }
  }, [employees, allOrders]);

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
            serviceId: item.id, // Preservar ID original del servicio de Firebase
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
      // Si NO hay servicios, establecer fecha de entrega automáticamente a hoy
      const serviceItems = cart.filter(item => item.type === 'service');
      const hasServices = serviceItems.length > 0;

      if (!hasServices && !formData.deliveryDate) {
        const today = new Date().toISOString().split('T')[0];
        setFormData(prev => ({
          ...prev,
          deliveryDate: today
        }));
      }

      setShowPayment(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const serviceItems = cart.filter(item => item.type === 'service');
      const hasServices = serviceItems.length > 0;

      // Si NO hay servicios, validar método de pago
      if (!hasServices) {
        // Si el método es pending, mostrar error
        if (formData.paymentMethod === 'pending') {
          alert('⚠️ Las órdenes sin servicios deben tener un método de pago definido.\n\nPor favor selecciona: Efectivo, Tarjeta o Transferencia.');
          setErrors({
            payment: 'Las órdenes sin servicios deben tener un método de pago definido. Selecciona efectivo, tarjeta o transferencia.'
          });
          return;
        }

        // Si tiene método de pago válido, forzar pago completo
        setRequireFullPayment(true);
        setShowPaymentScreen(true);
        return;
      }

      // Flujo normal para órdenes CON servicios
      if (formData.paymentMethod !== 'pending') {
        const servicesWithoutPrice = serviceItems.filter(item => item.price === 0);

        if (servicesWithoutPrice.length > 0) {
          // Hay servicios sin precio, mostrar modal para definirlos
          setVariablePriceServices(servicesWithoutPrice);
          setShowVariablePriceModal(true);
        } else {
          setRequireFullPayment(false);  // No requiere pago completo
          setShowPaymentScreen(true);
        }
      } else {
        // Flujo normal: crear orden directamente
        createOrder();
      }
    }
  };

  // Detectar si el carrito tiene servicio express
  const hasExpressService = () => {
    const serviceItems = cart.filter(item => item.type === 'service');
    return serviceItems.some(item =>
      item.serviceName?.toLowerCase() === 'servicio express'
    );
  };

  // Función para crear la orden (extraída para reutilizar)
  const createOrder = async (paymentStatus = null, advancePayment = 0, isOrderWithoutServices = false) => {
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
      subtotal: calculateSubtotal(), // Precio antes de descuentos
      totalDiscount: calculateTotalDiscount(), // Total de descuentos
      totalPrice: calculateTotalPrice(), // Precio final con descuentos
      appliedPromotions: appliedPromotions.map(promo => ({
        id: promo.id,
        name: promo.name,
        type: promo.type,
        discountAmount: promo.discountAmount
      })),
      advancePayment: advancePayment,
      paymentStatus: paymentStatus || (formData.paymentMethod === 'pending' ? 'pending' : 'partial'),
      priority: hasExpressService() ? 'high' : 'normal', // Asignar automáticamente
      author: selectedEmployee ? selectedEmployee.name : '', // Asignar empleado seleccionado
      isOrderWithoutServices: isOrderWithoutServices // Flag para firebaseService
    };

    // Incrementar uso de promociones (esperar a que termine antes de continuar)
    if (appliedPromotions.length > 0) {
      const { incrementPromotionUsage } = await import('../services/firebaseService');
      for (const promo of appliedPromotions) {
        try {
          await incrementPromotionUsage(promo.id, formData.phone);
        } catch (error) {
          console.error('Error incrementing promotion usage:', error);
        }
      }
    }

    // Esperar 1.5s para mostrar animación antes de cerrar
    setTimeout(() => {
      onSubmit(orderData);
    }, 1500);
  };

  // Handler para cuando se confirma el cobro desde PaymentScreen
  const handlePaymentConfirm = (paymentData) => {
    // Cerrar pantalla de cobro y crear orden con datos de pago
    setShowPaymentScreen(false);
    // Pasar flag de orden sin servicios
    createOrder(
      paymentData.paymentStatus,
      paymentData.advancePayment,
      paymentData.isOrderWithoutServices || false
    );
  };

  // Handler para cancelar desde PaymentScreen
  const handlePaymentCancel = () => {
    setShowPaymentScreen(false);
  };

  // Handler para cuando se confirman los precios variables
  const handleVariablePricesConfirm = (assignedPrices) => {
    // Actualizar precios en el carrito
    const updatedCart = cart.map(item => {
      if (item.type === 'service' && assignedPrices[item.id]) {
        return {
          ...item,
          price: assignedPrices[item.id]
        };
      }
      return item;
    });

    setCart(updatedCart);
    setShowVariablePriceModal(false);

    // Continuar a PaymentScreen
    setShowPaymentScreen(true);
  };

  // Handler para cancelar desde VariablePriceModal
  const handleVariablePricesCancel = () => {
    setShowVariablePriceModal(false);
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

      {/* Modal de Precios Variables */}
      {showVariablePriceModal && (
        <VariablePriceModal
          services={variablePriceServices}
          onConfirm={handleVariablePricesConfirm}
          onCancel={handleVariablePricesCancel}
        />
      )}

      {/* Modal de Calendario de Entregas */}
      <DeliveryCalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        allOrders={allOrders}
      />

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
          subtotal={calculateSubtotal()}
          totalDiscount={calculateTotalDiscount()}
          appliedPromotions={appliedPromotions}
          totalPrice={calculateTotalPrice()}
          advancePayment={0}
          paymentMethod={formData.paymentMethod}
          requireFullPayment={requireFullPayment}
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

              {/* Banner de promociones disponibles hoy */}
              {activePromotions.length > 0 && (
                <div className="available-promotions-banner">
                  <div className="banner-title">🎉 Promociones Disponibles Hoy:</div>
                  {activePromotions.map((promo, idx) => {
                    const isApplied = appliedPromotions.some(ap => ap.id === promo.id);
                    return (
                      <div key={idx} className={`promo-item ${isApplied ? 'applied' : ''}`}>
                        <span className="promo-emoji">{promo.emoji || '🎉'}</span>
                        <span className="promo-name">{promo.name}</span>
                        {isApplied && <span className="applied-badge">✓ APLICADA</span>}
                      </div>
                    );
                  })}
                </div>
              )}

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
                        {/* Show applied promotions for this item */}
                        {appliedPromotions
                          .filter(promo => {
                            // Filtrar según el tipo de promoción
                            switch (promo.type) {
                              case 'buyXgetY':
                              case 'buyXgetYdiscount':
                              case 'fixed':
                                // Verificar applicableItems (puede ser vacío = aplica a todos)
                                if (!promo.applicableItems || promo.applicableItems.length === 0) {
                                  return false; // No mostrar badge si aplica a todo
                                }
                                if (item.type === 'service' && item.serviceId) {
                                  return promo.applicableItems.includes(item.serviceId);
                                }
                                if (item.type === 'product' && item.productId) {
                                  return promo.applicableItems.includes(item.productId);
                                }
                                return false;

                              case 'percentage':
                                // Solo mostrar si es específico
                                if (promo.appliesTo !== 'specific' || !promo.specificItems) {
                                  return false;
                                }
                                if (item.type === 'service' && item.serviceId) {
                                  return promo.specificItems.includes(item.serviceId);
                                }
                                if (item.type === 'product' && item.productId) {
                                  return promo.specificItems.includes(item.productId);
                                }
                                return false;

                              case 'combo':
                                // Verificar si el item está en comboItems
                                if (!promo.comboItems || promo.comboItems.length === 0) {
                                  return false;
                                }
                                const itemId = item.type === 'service' ? item.serviceId : item.productId;
                                return promo.comboItems.some(ci => ci.id === itemId);

                              case 'dayOfWeek':
                              default:
                                // No mostrar badge para promociones generales
                                return false;
                            }
                          })
                          .map((promo, idx) => (
                            <PromotionBadge
                              key={idx}
                              promotion={promo}
                              discountAmount={promo.discountAmount}
                            />
                          ))
                        }
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
                {appliedPromotions.length > 0 ? (
                  <>
                    <div className="cart-subtotal">
                      <span className="subtotal-label">Subtotal:</span>
                      <span className="subtotal-value">${calculateSubtotal()}</span>
                    </div>
                    <div className="cart-discounts">
                      <span className="discount-label">Descuentos:</span>
                      <span className="discount-value">-${calculateTotalDiscount().toFixed(2)}</span>
                    </div>
                    <div className="cart-total">
                      <span className="total-label">Total:</span>
                      <span className="total-value">${calculateTotalPrice().toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="cart-total">
                    <span className="total-label">Total:</span>
                    <span className="total-value">${calculateTotalPrice()}</span>
                  </div>
                )}
              </div>

              {/* Sección de Asignación de Empleado */}
              {employees.length > 0 && (
                <div className="employee-assignment-section">
                  <div className="employee-assignment-header">
                    <span className="assignment-label">Asignar a:</span>
                    <span className="assignment-hint">(Opcional)</span>
                  </div>
                  <div className="employee-selection-grid">
                    {getEmployeesWithOrderCount().map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        className={`employee-card ${selectedEmployee?.id === emp.id ? 'selected' : ''}`}
                        onClick={() => setSelectedEmployee(selectedEmployee?.id === emp.id ? null : emp)}
                        title={`${emp.name} - ${emp.orderCount} órdenes activas`}
                      >
                        <span className="employee-emoji">{emp.emoji || '👤'}</span>
                        <span className="employee-order-count">{emp.orderCount}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                  <div className="date-input-with-button">
                    <input
                      type="date"
                      name="deliveryDate"
                      className={`form-input ${errors.deliveryDate ? 'error' : ''}`}
                      value={formData.deliveryDate}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="view-dates-btn"
                      onClick={() => setShowCalendarModal(true)}
                      title="Ver calendario de entregas"
                    >
                      📅 Ver fechas
                    </button>
                  </div>
                  {errors.deliveryDate && <span className="error-message">{errors.deliveryDate}</span>}
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
