import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import ImageUpload from './ImageUpload';
import ConfirmDialog from './ConfirmDialog';
import PaymentScreen from './PaymentScreen';
import VariablePriceModal from './VariablePriceModal';
import { subscribeToEmployees, getBusinessProfile } from '../services/firebaseService';
import { generateInvoicePDF } from '../utils/invoiceGenerator';
import { useNotification } from '../contexts/NotificationContext';
import './OrderDetailView.css';

const OrderDetailView = ({ order, currentTab, onClose, onSave, onCancel, onEmail, onWhatsApp, onEntregar, onBeforeClose }) => {
  const { showSuccess, showInfo } = useNotification();
  // ===== DECLARACIÓN DE TODOS LOS ESTADOS =====
  const [selectedImage, setSelectedImage] = useState(null);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [showVariablePriceModal, setShowVariablePriceModal] = useState(false);
  const [variablePriceServices, setVariablePriceServices] = useState([]);
  const [localServices, setLocalServices] = useState(() => {
    // Marcar automáticamente servicios "Servicio Express" como completados
    return (order.services || []).map(service => {
      if (service.serviceName?.toLowerCase() === 'servicio express') {
        return { ...service, status: 'completed' };
      }
      return service;
    });
  });
  const [localProducts, setLocalProducts] = useState(order.products || []);
  const [orderImages, setOrderImages] = useState(order.orderImages || []);
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [orderAuthor, setOrderAuthor] = useState(order.author || '');
  const [orderStatus, setOrderStatus] = useState(order.orderStatus || currentTab || 'recibidos');
  const [paymentData, setPaymentData] = useState({
    advancePayment: parseFloat(order.advancePayment) || 0,
    paymentStatus: order.paymentStatus || 'pending',
    paymentMethod: order.paymentMethod || 'pending'
  });
  const [localDeliveryDate, setLocalDeliveryDate] = useState(order.deliveryDate);
  const [generalNotes, setGeneralNotes] = useState(order.generalNotes || '');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'default'
  });
  const [flippingServices, setFlippingServices] = useState({});

  // Referencia al input de fecha
  const dateInputRef = useRef(null);

  // Ref para mantener datos actualizados sin disparar cleanup
  const latestOrderData = useRef();

  // Calcular totalPrice inicial de la orden
  const initialTotalPrice = useMemo(() => {
    const servicesTotal = (order.services || [])
      .filter(service => service.status !== 'cancelled')
      .reduce((sum, service) => sum + (service.price || 0), 0);

    const productsTotal = (order.products || [])
      .reduce((sum, product) => sum + ((product.salePrice || 0) * (product.quantity || 1)), 0);

    return servicesTotal + productsTotal;
  }, [order.services, order.products]);

  // Ref para guardar valores iniciales y detectar cambios
  const initialData = useRef({
    services: order.services || [],
    products: order.products || [],
    orderImages: order.orderImages || [],
    orderStatus: order.orderStatus || currentTab || 'recibidos',
    advancePayment: parseFloat(order.advancePayment) || 0,
    paymentStatus: order.paymentStatus || 'pending',
    paymentMethod: order.paymentMethod || 'pending',
    deliveryDate: order.deliveryDate,
    generalNotes: order.generalNotes || '',
    author: order.author || '',
    totalPrice: initialTotalPrice
  });

  // ===== CÁLCULOS DERIVADOS =====
  // Calcular precio total excluyendo servicios cancelados y sumando productos
  const totalPrice = useMemo(() => {
    const servicesTotal = localServices
      .filter(service => service.status !== 'cancelled')
      .reduce((sum, service) => sum + (service.price || 0), 0);

    const productsTotal = localProducts
      .reduce((sum, product) => sum + ((product.salePrice || 0) * (product.quantity || 1)), 0);

    return servicesTotal + productsTotal;
  }, [localServices, localProducts]);

  // ===== USE EFFECTS PARA SINCRONIZACIÓN =====
  // Cargar empleados activos
  useEffect(() => {
    const unsubscribe = subscribeToEmployees((employees) => {
      const active = employees.filter(emp => emp.status === 'active');
      setActiveEmployees(active);
    });

    return () => unsubscribe();
  }, []);

  // Actualizar ref cada vez que cambien los estados locales
  useEffect(() => {
    latestOrderData.current = {
      services: localServices,
      products: localProducts,
      orderImages: orderImages,
      orderStatus: orderStatus,
      advancePayment: paymentData.advancePayment,
      paymentStatus: paymentData.paymentStatus,
      paymentMethod: paymentData.paymentMethod,
      deliveryDate: localDeliveryDate,
      generalNotes: generalNotes,
      author: orderAuthor,
      totalPrice: totalPrice
    };
  }, [localServices, localProducts, orderImages, orderStatus, paymentData, localDeliveryDate, generalNotes, orderAuthor, totalPrice]);

  // Función que se ejecuta antes de cerrar el modal
  // Usamos useCallback para memoizar la función y evitar closures obsoletas
  const handleBeforeClose = useCallback(() => {
    console.log('🔍 [1] handleBeforeClose ejecutado');

    if (!latestOrderData.current || !onSave) {
      console.log('⚠️ [2] No hay datos o no hay onSave', {
        hasLatestData: !!latestOrderData.current,
        hasOnSave: !!onSave
      });
      return;
    }

    const current = latestOrderData.current;
    const initial = initialData.current;

    console.log('📊 [3] Comparando datos:', {
      current,
      initial,
      currentJSON: JSON.stringify(current),
      initialJSON: JSON.stringify(initial)
    });

    // Detectar cambios comparando datos actuales vs iniciales
    const changed = JSON.stringify(current) !== JSON.stringify(initial);

    console.log('🔄 [4] ¿Hay cambios?', changed);

    // Solo guardar si hay cambios reales
    if (changed) {
      // Excluir campos temporales que no deben guardarse en Firebase
      const { currentStatus, ...cleanOrder } = order;

      const updatedOrder = {
        ...cleanOrder,
        ...latestOrderData.current
      };
      console.log('💾 [5] Llamando onSave con:', updatedOrder);
      onSave(updatedOrder);
    } else {
      console.log('⏭️ [6] No hay cambios, saltando guardado');
    }
  }, [order, onSave]);

  // Pasar handleBeforeClose al padre vía callback
  useEffect(() => {
    console.log('🔄 [EFFECT] Pasando handleBeforeClose al parent');
    if (typeof onBeforeClose === 'function') {
      onBeforeClose(handleBeforeClose);
    }
    // IMPORTANTE: NO incluir handleBeforeClose en dependencias para evitar loop infinito
    // handleBeforeClose usa useCallback y refs, por lo que siempre tendrá valores actuales
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onBeforeClose]);

  // Estados disponibles para cada par (simplificado a 3 estados)
  const pairStatuses = [
    { value: 'pending', label: 'Pendiente', color: '#9ca3af' },
    { value: 'completed', label: 'Completado', color: '#10b981' },
    { value: 'cancelled', label: 'Cancelado', color: '#ef4444' }
  ];

  // Estados disponibles para la orden general (deben coincidir con las pestañas)
  const orderStatuses = [
    { value: 'recibidos', label: '📥 Recibidos' },
    { value: 'proceso', label: '🔧 En Proceso' },
    { value: 'listos', label: '✅ Listos' },
    { value: 'enEntrega', label: '🚚 En Entrega' }
  ];

  const advancePayment = paymentData.advancePayment;
  // Si el estado de pago es 'paid', el restante es 0, sino calcularlo normalmente
  const remainingPayment = paymentData.paymentStatus === 'paid' ? 0 : totalPrice - advancePayment;

  // Detectar si hay servicios con precio por definir ($0)
  const hasServicesWithoutPrice = localServices.some(service =>
    service.status !== 'cancelled' && service.price === 0
  );

  // Determinar si la orden está completamente pagada
  // Una orden NO está pagada si tiene servicios con precio $0 pendientes de definir
  const isFullyPaid = (remainingPayment <= 0 || paymentData.paymentStatus === 'paid') && !hasServicesWithoutPrice;

  // Determinar si mostrar botón de Entregar/Cobrar (usar orderStatus local en lugar de currentTab)
  const showDeliverButton = orderStatus === 'enEntrega';
  const deliverButtonText = !isFullyPaid ? '💰 Cobrar y Entregar' : '✅ Entregar Orden';

  // Métodos de pago
  const getPaymentMethodLabel = (method) => {
    const methods = {
      'cash': '💵 Efectivo',
      'card': '💳 Tarjeta',
      'transfer': '📱 Transferencia',
      'pending': '⏳ Pendiente'
    };
    return methods[method] || '⏳ Pendiente';
  };

  // Abrir modal de imagen
  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  // Cerrar modal de imagen
  const closeImageModal = () => {
    setSelectedImage(null);
  };


  const handleWhatsApp = () => {
    const phone = order.phone.replace(/\D/g, '');
    const message = `Hola ${order.client}, tu orden está lista para recoger. Total: $${totalPrice}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Cambiar estado de un servicio
  const handleServiceStatusChange = (serviceId, newStatus) => {
    const updatedServices = localServices.map(service =>
      service.id === serviceId ? { ...service, status: newStatus } : service
    );

    setLocalServices(updatedServices);
    // Cambios se guardarán al cerrar el modal
  };

  // Cambiar imágenes de la orden (a nivel de orden, no de servicio)
  const handleOrderImagesChange = (newImages) => {
    setOrderImages(newImages);
    // Cambios se guardarán al cerrar el modal
  };

  // Verificar si todos los servicios están completados o cancelados
  const allItemsCompletedOrCancelled = useMemo(() => {
    return localServices.every(service =>
      service.status === 'completed' || service.status === 'cancelled'
    );
  }, [localServices]);

  // Cambiar estado general de la orden
  const handleOrderStatusChange = (newStatus) => {
    // Validar si se intenta cambiar a "enEntrega"
    if (newStatus === 'enEntrega' && !allItemsCompletedOrCancelled) {
      alert('No se puede mover a "En Entrega" hasta que todos los items estén completados o cancelados');
      return;
    }

    setOrderStatus(newStatus);
    // Cambios se guardarán al cerrar el modal
  };

  // Handler para guardar la fecha de entrega
  const handleSaveDeliveryDate = (newDate) => {
    setLocalDeliveryDate(newDate);
    // Cambios se guardarán al cerrar el modal
  };

  // Handler para actualizar las notas generales
  const handleGeneralNotesChange = (e) => {
    setGeneralNotes(e.target.value);
    // Cambios se guardarán al cerrar el modal
  };

  // Handler para cambiar el autor de la orden
  const handleAuthorChange = (e) => {
    setOrderAuthor(e.target.value);
    // Cambios se guardarán al cerrar el modal
  };

  // Función para formatear fecha de entrega para mostrar
  const formatDeliveryDateDisplay = (dateString) => {
    // Parsear la fecha como local en lugar de UTC
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Remove time component for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return 'Hoy';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Mañana';
    } else {
      const options = { day: 'numeric', month: 'short', year: 'numeric' };
      return date.toLocaleDateString('es-ES', options);
    }
  };

  // Handler personalizado para cobrar
  const handleCobrar = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar Pago',
      message: `¿Confirmar pago de $${remainingPayment}?`,
      type: 'default',
      onConfirm: () => {
        // Actualizar estado local - se guardará al cerrar el modal
        setPaymentData({
          ...paymentData,
          paymentStatus: 'paid',
          paymentMethod: 'cash'
        });
        // Notificar al usuario
        showInfo('Pago registrado. Se guardará al cerrar el modal.');
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  // Handler para entregar - guarda todos los cambios y marca como entregada
  const handleGenerateInvoice = async () => {
    try {
      const businessProfile = await getBusinessProfile();
      const pdf = await generateInvoicePDF(order, businessProfile);

      // Abrir PDF en nueva pestaña (sin imprimir automáticamente)
      window.open(pdf.output('bloburl'), '_blank');

      showSuccess('Factura generada exitosamente');
    } catch (error) {
      console.error('Error generating invoice:', error);
      showInfo('Error al generar la factura');
    }
  };

  const handleEntregar = () => {
    // Si hay saldo pendiente, verificar primero precios variables
    if (!isFullyPaid) {
      // Detectar servicios con precio $0 (precio por definir)
      const servicesWithoutPrice = localServices.filter(service => service.price === 0);

      if (servicesWithoutPrice.length > 0) {
        // Hay servicios sin precio, mostrar modal para definirlos
        setVariablePriceServices(servicesWithoutPrice);
        setShowVariablePriceModal(true);
      } else {
        // No hay servicios sin precio, continuar a PaymentScreen
        setShowPaymentScreen(true);
      }
    } else {
      // Si ya está pagado, ejecutar entrega directamente
      executeDelivery();
    }
  };

  // Función para ejecutar la entrega (extraída para reutilizar)
  const executeDelivery = (updatedOrderData = null) => {
    if (latestOrderData.current && onEntregar) {
      // Excluir campos temporales antes de pasar al padre
      const { currentStatus, ...cleanOrder } = order;

      // Construir objeto final con todos los cambios del ref
      const updatedOrder = {
        ...cleanOrder,
        ...latestOrderData.current,
        ...updatedOrderData // Incluir datos adicionales (como paymentStatus)
      };

      // Llamar a onEntregar del padre (Dashboard/Orders)
      // Este manejará la confirmación y marcará como completada
      onEntregar(updatedOrder);
    }
  };

  // Handler para cuando se confirma el cobro desde PaymentScreen
  const handlePaymentConfirm = async (paymentData) => {
    try {
      // Cerrar pantalla de cobro
      setShowPaymentScreen(false);

      // Actualizar orden con pago completo y ejecutar entrega
      executeDelivery({
        paymentStatus: 'paid',
        paymentMethod: paymentData.paymentMethod || order.paymentMethod
      });
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  // Handler para cancelar desde PaymentScreen
  const handlePaymentCancel = () => {
    setShowPaymentScreen(false);
  };

  // Handler para cuando se confirman los precios variables
  const handleVariablePricesConfirm = (assignedPrices) => {
    // Actualizar precios en los servicios locales
    const updatedServices = localServices.map(service => {
      if (assignedPrices[service.id]) {
        return {
          ...service,
          price: assignedPrices[service.id]
        };
      }
      return service;
    });

    setLocalServices(updatedServices);
    setShowVariablePriceModal(false);

    // El useEffect se encargará de actualizar latestOrderData.current con el nuevo totalPrice
    // automáticamente cuando localServices cambie

    // Continuar a PaymentScreen
    setShowPaymentScreen(true);
  };

  // Handler para cancelar desde VariablePriceModal
  const handleVariablePricesCancel = () => {
    setShowVariablePriceModal(false);
  };

  // Obtener el label del estado
  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendiente',
      completed: 'Completado',
      cancelled: 'Cancelado'
    };
    return labels[status] || 'Pendiente';
  };

  // Manejar click en servicio con animación flip
  const handleServiceClick = (serviceId, currentStatus) => {
    // Prevenir clicks durante animación
    if (flippingServices[serviceId]) return;

    // Determinar siguiente estado en el loop: pending → completed → cancelled → pending
    const getNextStatus = (status) => {
      const statusLoop = ['pending', 'completed', 'cancelled'];
      const currentIndex = statusLoop.indexOf(status || 'pending');
      const nextIndex = (currentIndex + 1) % statusLoop.length;
      return statusLoop[nextIndex];
    };

    const nextStatus = getNextStatus(currentStatus);

    // Activar animación flip
    setFlippingServices(prev => ({ ...prev, [serviceId]: true }));

    // Cambiar estado LOCAL cuando la carta es menos visible (400ms - justo en el keyframe 50%)
    setTimeout(() => {
      handleServiceStatusChange(serviceId, nextStatus);
    }, 400);

    // Desactivar animación después de 800ms (duración total de la animación CSS)
    setTimeout(() => {
      setFlippingServices(prev => ({ ...prev, [serviceId]: false }));
    }, 800);
  };

  return (
    <div className="order-detail-view">
      {/* Modal de Precios Variables */}
      {showVariablePriceModal && (
        <VariablePriceModal
          services={variablePriceServices}
          onConfirm={handleVariablePricesConfirm}
          onCancel={handleVariablePricesCancel}
        />
      )}

      {/* Contenedor de flip global */}
      <div className={`order-detail-flip-container ${showPaymentScreen ? 'flipped' : ''}`}>
        {/* Front - Vista normal */}
        <div className="order-detail-flip-front">
      {/* Galería de Imágenes de la Orden */}
      <div className="order-gallery-section">
        <h3 className="section-title">📸 Galería de Imágenes de la Orden</h3>
        <ImageUpload
          images={orderImages}
          onChange={handleOrderImagesChange}
        />
      </div>

      {/* Información de Servicios */}
      <div className="order-pairs-section">
        <h3 className="section-title">🧼 Servicios ({localServices.filter(s => s.serviceName?.toLowerCase() !== 'servicio express').length})</h3>
        <div className="pairs-grid">
          {localServices.filter(service => service.serviceName?.toLowerCase() !== 'servicio express').map((service, index) => (
            <div
              key={service.id || index}
              className={`pair-detail-card pair-status-${service.status || 'pending'} ${flippingServices[service.id] ? 'flipping' : ''}`}
              onClick={() => handleServiceClick(service.id, service.status)}
              title="Click para cambiar estado"
            >
              <div className="pair-card-header">
                <div className="pair-header-left">
                  <span className="pair-number">{service.icon} Servicio #{index + 1}</span>
                  <span className={`pair-status-badge status-${service.status || 'pending'}`}>
                    {getStatusLabel(service.status || 'pending')}
                  </span>
                </div>
                <span className="pair-price-badge">${service.price}</span>
              </div>

              <div className="pair-card-body">
                <div className="pair-info-row">
                  <span className="pair-info-label">Servicio:</span>
                  <span className="pair-info-value">{service.serviceName}</span>
                </div>

                {/* Display de Estado (solo lectura visual) */}
                <div className="pair-status-display">
                  <span className="pair-info-label">Estado:</span>
                  <span className={`status-indicator status-${service.status || 'pending'}`}>
                    {getStatusLabel(service.status || 'pending')}
                  </span>
                </div>

                {service.notes && (
                  <div className="pair-notes">
                    <span className="pair-info-label">Notas:</span>
                    <p className="pair-notes-text">{service.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información de Productos (solo si hay productos) */}
      {localProducts && localProducts.length > 0 && (
        <div className="order-pairs-section">
          <h3 className="section-title">📦 Productos ({localProducts.length})</h3>
          <div className="pairs-grid">
            {localProducts.map((product, index) => (
              <div key={product.id || index} className="pair-detail-card product-card">
                <div className="pair-card-header">
                  <div className="pair-header-left">
                    <span className="pair-number">{product.emoji || '📦'} Producto #{index + 1}</span>
                    <span className="product-quantity-badge">x{product.quantity}</span>
                  </div>
                  <span className="pair-price-badge">${product.salePrice * product.quantity}</span>
                </div>

                <div className="pair-card-body">
                  <div className="pair-info-row">
                    <span className="pair-info-label">Producto:</span>
                    <span className="pair-info-value">{product.name}</span>
                  </div>

                  <div className="pair-info-row">
                    <span className="pair-info-label">SKU:</span>
                    <span className="pair-info-value">{product.sku}</span>
                  </div>

                  {product.barcode && (
                    <div className="pair-info-row">
                      <span className="pair-info-label">Código de Barras:</span>
                      <span className="pair-info-value">{product.barcode}</span>
                    </div>
                  )}

                  <div className="pair-info-row">
                    <span className="pair-info-label">Categoría:</span>
                    <span className="pair-info-value">{product.category}</span>
                  </div>

                  <div className="pair-info-row">
                    <span className="pair-info-label">Precio Unitario:</span>
                    <span className="pair-info-value">${product.salePrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información de Pago y Entrega */}
      <div className="order-details-grid">
        {/* Pago */}
        <div className="detail-card">
          <h3 className="detail-card-title">💰 Información de Pago</h3>
          <div className="detail-card-content">
            <div className="detail-row">
              <span className="detail-label">Precio Total:</span>
              <span className="detail-value price-large">${totalPrice}</span>
            </div>
            {advancePayment > 0 && (
              <>
                <div className="detail-row">
                  <span className="detail-label">Anticipo:</span>
                  <span className="detail-value">${advancePayment}</span>
                </div>
                <div className="detail-row highlight">
                  <span className="detail-label">Restante por Cobrar:</span>
                  <span className="detail-value price-highlight">${remainingPayment}</span>
                </div>
              </>
            )}
            <div className="detail-row">
              <span className="detail-label">Método de Pago:</span>
              <span className="detail-value">{getPaymentMethodLabel(paymentData.paymentMethod)}</span>
            </div>
            {isFullyPaid && (
              <div className="detail-row payment-complete">
                <span className="detail-label">Estado de Pago:</span>
                <span className="detail-value payment-status-badge">✅ Pagado Completo</span>
              </div>
            )}
          </div>
        </div>

        {/* Entrega */}
        <div className="detail-card">
          <h3 className="detail-card-title">📅 Información de Entrega</h3>
          <div className="detail-card-content">
            <div className="detail-row">
              <span className="detail-label">Fecha de Entrega:</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
                <span className="detail-value">{formatDeliveryDateDisplay(localDeliveryDate)}</span>
                <div style={{ position: 'relative' }}>
                  <button
                    className="btn-edit-date"
                    style={{
                      padding: '4px 8px',
                      background: 'transparent',
                      border: '1px solid var(--color-gray-700)',
                      borderRadius: '4px',
                      color: 'var(--color-gray-500)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    📅
                  </button>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={localDeliveryDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleSaveDeliveryDate(e.target.value);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                      zIndex: 2
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="detail-row">
              <span className="detail-label">Estado de la Orden:</span>
              <select
                className={`order-status-select status-${orderStatus}`}
                value={orderStatus}
                onChange={(e) => handleOrderStatusChange(e.target.value)}
              >
                {orderStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            {!allItemsCompletedOrCancelled && (
              <div className="detail-row" style={{ marginTop: '8px' }}>
                <span style={{
                  fontSize: '12px',
                  color: '#f59e0b',
                  fontStyle: 'italic'
                }}>
                  ⚠️ Para mover a "En Entrega", todos los servicios deben estar completados o cancelados
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información de la Orden */}
      <div className="order-details-grid">
        <div className="detail-card">
          <h3 className="detail-card-title">📋 Información de la Orden</h3>
          <div className="detail-card-content">
            <div className="detail-row">
              <span className="detail-label">Fecha de Recepción:</span>
              <span className="detail-value">
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'No disponible'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Número de Orden:</span>
              <span className="detail-value">#{parseInt(order.orderNumber, 10)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Autor de la Orden:</span>
              <select
                className={`author-select ${orderAuthor ? 'has-value' : ''}`}
                value={orderAuthor}
                onChange={handleAuthorChange}
              >
                <option value="">Sin asignar</option>
                {activeEmployees.map(employee => (
                  <option key={employee.id} value={employee.name}>
                    {employee.name} - {employee.role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Notificaciones de WhatsApp */}
      {order.whatsappNotifications && order.whatsappNotifications.length > 0 && (
        <div className="order-details-grid">
          <div className="detail-card">
            <h3 className="detail-card-title">💬 Conversación WhatsApp</h3>
            <div className="detail-card-content">
              <div className="whatsapp-chat-container">
                {order.whatsappNotifications.map((notification, index) => {
                  const isIncoming = notification.type === 'received' || notification.direction === 'incoming';
                  const timestamp = notification.sentAt || notification.timestamp || notification.receivedAt;

                  return (
                    <div
                      key={index}
                      className={`whatsapp-message ${isIncoming ? 'incoming' : 'outgoing'} ${notification.status || ''}`}
                    >
                      <div className="message-content">
                        {notification.message && (
                          <div className="message-text">
                            {notification.message}
                          </div>
                        )}
                        {notification.error && (
                          <div className="message-error">
                            ❌ Error: {notification.error}
                          </div>
                        )}
                        <div className="message-footer">
                          <span className="message-timestamp">
                            {new Date(timestamp).toLocaleString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {!isIncoming && notification.status === 'sent' && (
                            <span className="message-status">✓✓</span>
                          )}
                          {!isIncoming && notification.status === 'failed' && (
                            <span className="message-status">!</span>
                          )}
                        </div>
                      </div>
                      {isIncoming && (
                        <div className="message-label">Cliente</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notas Generales */}
      <div className="order-details-grid">
        <div className="detail-card">
          <h3 className="detail-card-title">📝 Notas Generales</h3>
          <div className="detail-card-content">
            <textarea
              className="form-input form-textarea"
              placeholder="Escribe notas generales de la orden..."
              rows="4"
              value={generalNotes}
              onChange={handleGeneralNotesChange}
              style={{
                width: '100%',
                resize: 'vertical',
                fontFamily: 'inherit',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--color-gray-800)',
                borderRadius: '10px',
                color: 'var(--color-white)',
                fontSize: '15px',
                lineHeight: '1.6'
              }}
            />
          </div>
        </div>
      </div>

      {/* Botones de Cierre de Orden */}
      {showDeliverButton && (
        <div className="order-close-section">
          <button
            className={`btn-close-order ${!isFullyPaid ? 'btn-cobrar-large' : 'btn-entregar-large'}`}
            onClick={handleEntregar}
          >
            <span className="btn-close-icon">{!isFullyPaid ? '💰' : '📦'}</span>
            <div className="btn-close-content">
              <span className="btn-close-title">{deliverButtonText}</span>
              <span className="btn-close-subtitle">
                {!isFullyPaid ? `Cobrar $${remainingPayment.toFixed(2)} y entregar` : 'Marcar como completada y entregada'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="order-actions-footer">
        <div className="action-buttons-grid">
          <button
            className="action-btn btn-whatsapp"
            onClick={handleWhatsApp}
          >
            <span className="action-icon">💬</span>
            <span className="action-text">WhatsApp</span>
          </button>

          <button
            className="action-btn btn-email"
            onClick={() => onEmail && onEmail(order)}
          >
            <span className="action-icon">📧</span>
            <span className="action-text">Enviar Email</span>
          </button>

          <button
            className="action-btn btn-invoice"
            onClick={handleGenerateInvoice}
          >
            <span className="action-icon">🧾</span>
            <span className="action-text">Generar Factura</span>
          </button>

          <button
            className="action-btn btn-cancel"
            onClick={() => onCancel && onCancel(order)}
          >
            <span className="action-icon">🗑️</span>
            <span className="action-text">Cancelar Orden</span>
          </button>
        </div>
      </div>

      {/* Modal de Imagen */}
      {selectedImage && (
        <div className="image-modal" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeImageModal}>
              ✕
            </button>
            <img src={selectedImage} alt="Vista ampliada" className="image-modal-img" />
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>

    {/* Back - Payment Screen */}
    <div className="order-detail-flip-back">
      <PaymentScreen
        services={localServices}
        products={localProducts}
        totalPrice={totalPrice}
        advancePayment={paymentData.advancePayment}
        paymentMethod={paymentData.paymentMethod}
        allowEditMethod={true}
        onConfirm={handlePaymentConfirm}
        onCancel={handlePaymentCancel}
      />
    </div>
  </div>
    </div>
  );
};

export default OrderDetailView;
