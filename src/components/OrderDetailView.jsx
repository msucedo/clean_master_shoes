import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import ImageUpload from './ImageUpload';
import ConfirmDialog from './ConfirmDialog';
import PaymentScreen from './PaymentScreen';
import VariablePriceModal from './VariablePriceModal';
import PrintConfirmModal from './PrintConfirmModal';
import { getBusinessProfile, updateOrder, addPrintRecord, hasPrintRecord } from '../services/firebaseService';
import { generateInvoicePDF } from '../utils/invoiceGenerator';
import { printTicket, getPrinterStatus } from '../services/printService';
import { addPrintJob } from '../services/printQueueService';
import { getPrinterMethodPreference, PRINTER_METHODS } from '../utils/printerConfig';
import { useNotification } from '../contexts/NotificationContext';
import { useAdminCheck, useAuth } from '../contexts/AuthContext';
import './OrderDetailView.css';

// Función para mostrar fecha relativa con hora
const getRelativeTimeWithHour = (dateString) => {
  if (!dateString) return 'Nunca';

  const date = new Date(dateString);
  const now = new Date();

  // Crear fechas sin hora para comparar días de calendario
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffInMs = nowOnly - dateOnly;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Obtener hora en formato HH:MM
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  if (diffInDays === 0) return `hoy ${timeStr}`;
  if (diffInDays === 1) return `ayer ${timeStr}`;
  if (diffInDays === 2) return `hace dos días ${timeStr}`;
  if (diffInDays === 3) return `hace tres días ${timeStr}`;
  if (diffInDays < 7) return `hace ${diffInDays} días ${timeStr}`;
  if (diffInDays < 14) return `hace 1 semana ${timeStr}`;
  if (diffInDays < 30) return `hace ${Math.floor(diffInDays / 7)} semanas ${timeStr}`;
  if (diffInDays < 60) return `hace 1 mes`;
  if (diffInDays < 365) return `hace ${Math.floor(diffInDays / 30)} meses`;
  return `hace ${Math.floor(diffInDays / 365)} años`;
};

const OrderDetailView = ({ order, currentTab, onClose, onSave, onCancel, onEmail, onWhatsApp, onEntregar, onBeforeClose, renderHeader, readOnly = false, employees = [] }) => {
  const { showSuccess, showInfo, showError } = useNotification();
  const isAdmin = useAdminCheck();
  const { user } = useAuth();

  // Determinar si la orden es de solo lectura
  const isReadOnly = readOnly || ['completados', 'cancelado'].includes(order.orderStatus);

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
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [localInvoice, setLocalInvoice] = useState(order.invoice || null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printConfirmModal, setPrintConfirmModal] = useState({
    isOpen: false,
    ticketType: null
  });

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
  // Actualizar empleados activos cuando cambien las props
  useEffect(() => {
    setActiveEmployees(employees);
  }, [employees]);

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

  // Marcar mensajes de WhatsApp como leídos al abrir la orden
  useEffect(() => {
    const markAsRead = async () => {
      if (order.hasUnreadMessages === true) {
        try {
          await updateOrder(order.id, {
            hasUnreadMessages: false
          });
          console.log('✅ Mensajes de WhatsApp marcados como leídos');
        } catch (error) {
          console.error('❌ Error marcando mensajes como leídos:', error);
        }
      }
    };

    markAsRead();
  }, [order.id]); // Solo ejecutar una vez al montar

  // Llamar a renderHeader si existe, pasándole la info necesaria
  useEffect(() => {
    if (renderHeader) {
      renderHeader({
        orderNumber: parseInt(order.orderNumber, 10),
        client: order.client,
        createdAt: getRelativeTimeWithHour(order.createdAt),
        author: orderAuthor,
        activeEmployees: activeEmployees,
        onAuthorChange: handleAuthorChange,
        isReadOnly: isReadOnly
      });
    }
  }, [renderHeader, order.orderNumber, order.client, order.createdAt, orderAuthor, activeEmployees, isReadOnly]);

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

  // Manejar impresión de tickets
  const handlePrint = async (type) => {
    // Prevenir doble-click
    if (isPrinting) {
      showInfo('Ya hay una impresión en proceso, por favor espera...');
      return;
    }

    setIsPrinting(true);

    // Verificar preferencia del usuario
    const userPreference = getPrinterMethodPreference();
    const shouldUseQueue = userPreference === PRINTER_METHODS.QUEUE || userPreference === 'queue';

    // Safety timeout como backup
    const safetyTimeoutId = setTimeout(() => {
      console.log('⏱️ Safety timeout: liberando UI');
      setIsPrinting(false);
    }, 5000);

    try {

      if (shouldUseQueue) {
        // Usar cola: mostrar modal
        clearTimeout(safetyTimeoutId);
        setIsPrinting(false);
        setPrintConfirmModal({
          isOpen: true,
          ticketType: type
        });
        return;
      }

      // Impresión directa: verificar estado de impresora Bluetooth
      const printerStatus = getPrinterStatus();

      // Configurar opciones de impresión
      let options = {};

      // Si hay impresora Bluetooth conectada, usarla directamente
      if (printerStatus.isConnected) {
        console.log('✅ Impresora Bluetooth conectada, usando método bluetooth');
        options.method = 'bluetooth';
      } else {
        console.log('ℹ️ Sin impresora Bluetooth conectada, usando detección automática');
      }

      // Imprimir
      const result = await printTicket(order, type, options);

      // Limpiar timeout - operación completó
      clearTimeout(safetyTimeoutId);

      if (!result.success) {
        if (result.cancelled) {
          showInfo('Impresión cancelada');
        } else {
          // Si falla porque no hay impresora conectada, dar instrucciones
          if (result.needsConnection) {
            showError('Por favor, conecta una impresora Bluetooth desde Configuración');
          } else {
            showError(result.error || 'Error al imprimir');
          }
        }
        return;
      }

      // Registrar en Firebase
      const printData = {
        type,
        printedAt: new Date().toISOString(),
        printedBy: 'manual',
        deviceInfo: result.method === 'bluetooth' ? `Bluetooth (${printerStatus.deviceName || 'Impresora'})` :
                   result.method === 'desktop' ? 'Desktop' : 'Mobile'
      };

      const recordResult = await addPrintRecord(order.id, printData);

      if (recordResult.success) {
        showSuccess(`Ticket ${type === 'receipt' ? 'de recepción' : 'de entrega'} impreso`);
        // Opcional: refrescar orden para ver printHistory actualizado
      } else {
        showError(`Ticket impreso, pero no se guardó en el historial`);
      }
    } catch (error) {
      clearTimeout(safetyTimeoutId);
      showError('Error al imprimir: ' + error.message);
    } finally {
      clearTimeout(safetyTimeoutId);
      setIsPrinting(false);
    }
  };

  // Handlers for print confirm modal
  const handlePrintConfirm = async () => {
    try {
      await addPrintJob(
        order.id,
        order.orderNumber,
        printConfirmModal.ticketType
      );

      showSuccess('Ticket enviado a la impresora del local');

      setPrintConfirmModal({ isOpen: false, ticketType: null });
    } catch (error) {
      console.error('Error adding print job:', error);
      showError('Error al enviar ticket a impresora');
    }
  };

  const handlePrintCancel = () => {
    setPrintConfirmModal({ isOpen: false, ticketType: null });
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

  // Handler para generar factura - genera PDF y lo guarda en Firebase
  const handleGenerateInvoice = async () => {
    try {
      const businessProfile = await getBusinessProfile();
      const pdf = await generateInvoicePDF(order, businessProfile);

      // Convertir PDF a base64 para guardar en Firebase
      const pdfBase64 = pdf.output('datauristring');

      // Guardar factura en la orden
      const invoiceData = {
        pdfData: pdfBase64,
        generatedAt: new Date().toISOString(),
        generatedBy: user?.email || 'unknown'
      };

      // Actualizar orden en Firebase con la factura
      await updateOrder(order.id, {
        invoice: invoiceData
      });

      // Actualizar estado local para que los botones se actualicen inmediatamente
      setLocalInvoice(invoiceData);

      // Detectar si es móvil (menos de 768px)
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        // En móvil: abrir modal de preview automáticamente
        setIsPdfPreviewOpen(true);
        showSuccess('Factura generada y guardada exitosamente');
      } else {
        // En escritorio: abrir en nueva pestaña
        window.open(pdf.output('bloburl'), '_blank');
        showSuccess('Factura generada y guardada exitosamente');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      showInfo('Error al generar la factura');
    }
  };

  // Handler para ver factura guardada
  const handleViewSavedInvoice = () => {
    try {
      if (localInvoice && localInvoice.pdfData) {
        // Abrir modal de preview
        setIsPdfPreviewOpen(true);
      } else {
        showInfo('No hay factura guardada para esta orden');
      }
    } catch (error) {
      console.error('Error viewing saved invoice:', error);
      showInfo('Error al abrir la factura guardada');
    }
  };

  // Función helper para convertir data URI a Blob
  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  // Handler para descargar factura guardada
  const handleDownloadInvoice = async () => {
    try {
      if (localInvoice && localInvoice.pdfData) {
        // Generar nombre de archivo
        const orderNum = order.orderNumber || order.id.substring(0, 8);
        const clientName = order.client.replace(/\s+/g, '_');
        const date = new Date(order.createdAt).toLocaleDateString('es-MX').replace(/\//g, '-');
        const fileName = `Factura_${orderNum}_${clientName}_${date}.pdf`;

        // Detectar si es móvil o tablet (menos de 768px)
        const isMobile = window.innerWidth < 768;

        if (isMobile) {
          // En móviles: intentar usar Web Share API
          if (navigator.share && navigator.canShare) {
            try {
              // Convertir data URI a Blob
              const blob = dataURItoBlob(localInvoice.pdfData);
              const file = new File([blob], fileName, { type: 'application/pdf' });

              // Verificar si se puede compartir
              if (navigator.canShare({ files: [file] })) {
                // IMPORTANTE: En iOS/iPadOS no se debe incluir title, text o url junto con files
                // Esto causa que iOS cree archivos de texto adicionales no deseados
                await navigator.share({
                  files: [file]
                });
                showSuccess('Factura compartida exitosamente');
                return;
              }
            } catch (shareError) {
              console.log('Web Share API no disponible o cancelada:', shareError);
              // Si falla, continuar con el método de abrir en nueva ventana
            }
          }

          // Si Web Share API no está disponible o falló, abrir en nueva ventana
          // El usuario puede usar las opciones del navegador para descargar
          const newWindow = window.open(localInvoice.pdfData, '_blank');
          if (newWindow) {
            showSuccess('Factura abierta. Usa las opciones del navegador para descargar o compartir');
          } else {
            showInfo('Por favor, permite las ventanas emergentes para ver la factura');
          }
        } else {
          // En escritorio: descarga directa tradicional
          const link = document.createElement('a');
          link.href = localInvoice.pdfData;
          link.download = fileName;

          // Disparar descarga
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          showSuccess('Factura descargada exitosamente');
        }
      } else {
        showInfo('No hay factura guardada para esta orden');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showInfo('Error al descargar la factura');
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

      {/* Mensaje de Solo Lectura */}
      {isReadOnly && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '14px' }}>
            {order.orderStatus === 'completados'
              ? 'Esta orden está completada y no puede editarse'
              : order.orderStatus === 'cancelado'
              ? 'Esta orden está cancelada y no puede editarse'
              : 'Esta orden no puede editarse'}
          </span>
        </div>
      )}

      {/* Galería de Imágenes de la Orden */}
      <div className="order-gallery-section">
        <h3 className="section-title">📸 Galería de Imágenes de la Orden</h3>
        <ImageUpload
          images={orderImages}
          onChange={isReadOnly ? undefined : handleOrderImagesChange}
          readOnly={isReadOnly}
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
              onClick={isReadOnly ? undefined : () => handleServiceClick(service.id, service.status)}
              title={isReadOnly ? "" : "Click para cambiar estado"}
              style={isReadOnly ? { cursor: 'default' } : {}}
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
                {!isReadOnly && (
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
                )}
              </div>
            </div>
            <div className="detail-row">
              <span className="detail-label">Estado de la Orden:</span>
              <select
                className={`order-status-select status-${orderStatus}`}
                value={orderStatus}
                onChange={(e) => handleOrderStatusChange(e.target.value)}
                disabled={isReadOnly}
                style={{
                  opacity: isReadOnly ? 0.6 : 1,
                  cursor: isReadOnly ? 'not-allowed' : 'pointer'
                }}
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
              disabled={isReadOnly}
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
                lineHeight: '1.6',
                opacity: isReadOnly ? 0.6 : 1,
                cursor: isReadOnly ? 'not-allowed' : 'text'
              }}
            />
          </div>
        </div>
      </div>

      {/* Botones de Cierre de Orden */}
      {showDeliverButton && !isReadOnly && (
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
      {!isReadOnly && (
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

            {/* Botón imprimir recibo */}
            <button
              className="action-btn btn-print"
              onClick={() => handlePrint('receipt')}
              disabled={isPrinting}
            >
              <span className="action-icon">🖨️</span>
              <span className="action-text">
                Imprimir Recibo
                {hasPrintRecord(order, 'receipt') && <span style={{ marginLeft: '5px', color: '#4caf50', fontWeight: 'bold' }}>✓</span>}
              </span>
            </button>

            {/* Botón imprimir comprobante - solo si orden completada */}
            {(order.orderStatus === 'completados' || order.orderStatus === 'enEntrega') && (
              <button
                className="action-btn btn-print"
                onClick={() => handlePrint('delivery')}
                disabled={isPrinting}
              >
                <span className="action-icon">🖨️</span>
                <span className="action-text">
                  Imprimir Comprobante
                  {hasPrintRecord(order, 'delivery') && <span style={{ marginLeft: '5px', color: '#4caf50', fontWeight: 'bold' }}>✓</span>}
                </span>
              </button>
            )}

            {/* Botón para ver factura guardada (si existe) */}
            {localInvoice && localInvoice.pdfData && (
              <button
                className="action-btn btn-invoice"
                onClick={handleViewSavedInvoice}
              >
                <span className="action-icon">📄</span>
                <span className="action-text">Ver Factura Guardada</span>
              </button>
            )}

            {/* Botón para generar/regenerar factura */}
            <button
              className="action-btn btn-invoice"
              onClick={handleGenerateInvoice}
            >
              <span className="action-icon">🧾</span>
              <span className="action-text">
                {localInvoice && localInvoice.pdfData ? 'Regenerar Factura' : 'Generar Factura'}
              </span>
            </button>

            {isAdmin && (
              <button
                className="action-btn btn-cancel"
                onClick={() => onCancel && onCancel(order)}
              >
                <span className="action-icon">🗑️</span>
                <span className="action-text">Cancelar Orden</span>
              </button>
            )}
          </div>
        </div>
      )}

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

      {/* Modal de Preview de Factura */}
      {isPdfPreviewOpen && localInvoice && localInvoice.pdfData && (
        <div className="pdf-preview-modal-overlay" onClick={() => setIsPdfPreviewOpen(false)}>
          <div className="pdf-preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-preview-header">
              <h3>Vista Previa de Factura</h3>
              <div className="pdf-preview-actions">
                <button
                  className="pdf-preview-btn pdf-download-btn"
                  onClick={handleDownloadInvoice}
                >
                  ⬇️ Descargar PDF
                </button>
                <button
                  className="pdf-preview-btn pdf-close-btn"
                  onClick={() => setIsPdfPreviewOpen(false)}
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>
            <div className="pdf-preview-body">
              <iframe
                src={localInvoice.pdfData}
                width="100%"
                height="600px"
                title="Factura PDF Preview"
                style={{ border: 'none', borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Print Confirm Modal (for queue/remote printing) */}
      <PrintConfirmModal
        isOpen={printConfirmModal.isOpen}
        orderNumber={order.orderNumber}
        onConfirm={handlePrintConfirm}
        onCancel={handlePrintCancel}
      />
    </div>
  );
};

export default OrderDetailView;
