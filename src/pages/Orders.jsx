import { useState, useEffect, useRef } from 'react';
import Modal from '../components/Modal';
import OrderForm from '../components/OrderForm';
import OrderFormMobile from '../components/OrderFormMobile';
import OrderDetailView from '../components/OrderDetailView';
import OrderCard from '../components/OrderCard';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  subscribeToOrders,
  updateOrder,
  subscribeToEmployees
} from '../services/firebaseService';
import { useNotification } from '../contexts/NotificationContext';
import './Orders.css';

// Estructura inicial vacía para las órdenes
const EMPTY_ORDERS = {
  recibidos: [],
  proceso: [],
  listos: [],
  enEntrega: [],
  completados: []
};

const Orders = () => {
  const { showSuccess, showError, showInfo } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('recibidos');
  const [orders, setOrders] = useState(EMPTY_ORDERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const saveOnCloseRef = useRef(null);
  const [headerData, setHeaderData] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'default'
  });
  // Detectar si es smartphone (< 768px)
  const [isSmartphone, setIsSmartphone] = useState(window.innerWidth < 768);

  // Escuchar cambios de tamaño de ventana para actualizar isSmartphone
  useEffect(() => {
    const handleResize = () => {
      setIsSmartphone(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Subscribe to real-time orders updates
  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToOrders((ordersData) => {
      setOrders(ordersData);
      setLoading(false);
      setError(null);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Subscribe to real-time employees updates
  useEffect(() => {
    const unsubscribe = subscribeToEmployees((employeesData) => {
      // Filtrar solo empleados activos
      const activeEmployees = employeesData.filter(emp => emp.status === 'active');
      setEmployees(activeEmployees);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);


  const filterOrders = (ordersList) => {
    // Validar que ordersList existe y es un array
    if (!ordersList || !Array.isArray(ordersList)) return [];

    if (!searchTerm) return ordersList;

    return ordersList.filter(order => {
      const searchLower = searchTerm.toLowerCase();

      // Buscar en campos básicos
      const basicMatch =
        order.client.toLowerCase().includes(searchLower) ||
        order.phone.includes(searchLower) ||
        (order.orderNumber && order.orderNumber.includes(searchLower));

      // Buscar en modelo (formato antiguo)
      const modelMatch = order.model?.toLowerCase().includes(searchLower);

      // Buscar en pares de tenis (formato nuevo)
      const pairsMatch = order.shoePairs?.some(pair =>
        pair.model?.toLowerCase().includes(searchLower) ||
        pair.service?.toLowerCase().includes(searchLower)
      );

      return basicMatch || modelMatch || pairsMatch;
    });
  };

  const handleOpenNewOrder = () => {
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log('🚪 [ORDERS] Cerrando modal', {
      hasSaveOnClose: !!saveOnCloseRef.current
    });

    // Ejecutar guardado si existe (solo guarda si hay cambios)
    if (saveOnCloseRef.current) {
      console.log('💾 [ORDERS] Ejecutando saveOnClose...');
      saveOnCloseRef.current();
      saveOnCloseRef.current = null; // Limpiar después de usar
    }

    // Cerrar modal
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const generateOrderId = () => {
    // Get all orders from all columns
    const allOrders = [
      ...(orders.recibidos || []),
      ...(orders.proceso || []),
      ...(orders.listos || []),
      ...(orders.enEntrega || []),
      ...(orders.completados || [])
    ];

    // Find the highest order number
    const maxId = allOrders.reduce((max, order) => {
      const idNum = parseInt(order.orderNumber || '0');
      return idNum > max ? idNum : max;
    }, 0);

    // Return next ID with padding
    return String(maxId + 1).padStart(5, '0');
  };

  const formatDeliveryDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Remove time component for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return { text: 'Entrega: Hoy', className: 'urgent' };
    } else if (date.getTime() === tomorrow.getTime()) {
      return { text: 'Entrega: Mañana', className: 'soon' };
    } else {
      const options = { day: 'numeric', month: 'short' };
      return {
        text: `Entrega: ${date.toLocaleDateString('es-ES', options)}`,
        className: ''
      };
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleSaveOrder = async (updatedOrder) => {
    console.log('🔥 [FIREBASE] handleSaveOrder llamado con:', updatedOrder);
    try {
      const result = await updateOrder(updatedOrder.id, updatedOrder);
      console.log('✅ [FIREBASE] Orden actualizada exitosamente');

      // Siempre mostrar notificación de orden actualizada
      showSuccess('Orden actualizada exitosamente ✓');

      // Si hubo cambio a "enEntrega", mostrar segunda notificación según resultado del WhatsApp
      if (result.whatsappResult) {
        const whatsapp = result.whatsappResult;

        if (whatsapp.success) {
          showSuccess(`WhatsApp enviado a ${updatedOrder.client} ✓`);
        } else if (whatsapp.skipped) {
          showInfo('WhatsApp no configurado, enviar mensaje manualmente.');
        } else {
          // WhatsApp falló
          showError(
            `WhatsApp falló: ${whatsapp.error || 'Error desconocido'}. ` +
            `Enviar mensaje manualmente a ${updatedOrder.phone}.`
          );
          console.error('❌ [UI] Detalles del error de WhatsApp:', whatsapp);
        }
      }

      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('❌ [FIREBASE] Error saving order:', error);
      showError('Error al guardar la orden. Por favor intenta de nuevo.');
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      recibidos: { label: 'Recibidos', icon: '📥', color: '#3b82f6' },
      proceso: { label: 'En Proceso', icon: '🔧', color: '#f59e0b' },
      listos: { label: 'Listos', icon: '✅', color: '#10b981' },
      enEntrega: { label: 'En Entrega', icon: '🚚', color: '#8b5cf6' }
    };
    return statusMap[status] || statusMap.recibidos;
  };

  const handleCancelOrder = (order) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancelar Orden',
      message: `¿Estás seguro de cancelar la orden #${order.orderNumber || order.id}?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          // Marcar orden como cancelada en lugar de borrarla
          await updateOrder(order.id, {
            ...order,
            orderStatus: 'cancelado',
            cancelledAt: new Date().toISOString()
          });
          handleCloseModal();
          showSuccess('Orden cancelada exitosamente');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          // Real-time listener will update the UI automatically
        } catch (error) {
          console.error('Error cancelling order:', error);
          showError('Error al cancelar la orden');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      }
    });
  };

  const handleEmail = (order) => {
    // TODO: Implementar envío de correo
    showInfo(`Enviar correo a ${order.client}. Se seleccionará plantilla según etapa de la orden.`);
  };

  const handleWhatsApp = (order) => {
    const phone = order.phone.replace(/\D/g, '');
    const message = `Hola ${order.client}, tu orden #${order.orderNumber || order.id} está lista!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    showSuccess('Abriendo WhatsApp...');
  };

  const handleEntregar = (order) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Entregar Orden',
      message: `¿Marcar orden #${order.orderNumber || order.id} como entregada?`,
      type: 'default',
      onConfirm: async () => {
        try {
          // Excluir campos temporales antes de guardar
          const { currentStatus, ...cleanOrder } = order;

          // Actualizar orden con estado completado y asegurar que el pago esté marcado como completado
          const completedOrder = {
            ...cleanOrder,
            orderStatus: 'completados',
            completedDate: new Date().toISOString(),
            paymentStatus: 'paid',
            paymentMethod: order.paymentMethod === 'pending' ? 'cash' : order.paymentMethod
          };

          await updateOrder(order.id, completedOrder);

          // IMPORTANTE: Limpiar saveOnCloseRef para evitar que sobrescriba el estado completado
          saveOnCloseRef.current = null;

          handleCloseModal();
          showSuccess(`Orden #${order.orderNumber || order.id} entregada exitosamente`);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          // Real-time listener will update the UI automatically
        } catch (error) {
          console.error('Error marking order as delivered:', error);
          showError('Error al marcar la orden como entregada');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      }
    });
  };

  const handleSubmitOrder = async (formData) => {
    try {
      // Create new order with services format
      const newOrder = {
        orderNumber: generateOrderId(), // Número de orden visible para el usuario
        client: formData.client,
        phone: formData.phone,
        email: formData.email || '',
        services: formData.services || [],
        products: formData.products || [],
        orderImages: formData.orderImages || [],
        totalPrice: formData.totalPrice || 0,
        deliveryDate: formData.deliveryDate,
        priority: formData.priority || 'normal',
        paymentMethod: formData.paymentMethod || 'pending',
        advancePayment: formData.advancePayment || 0,
        generalNotes: formData.generalNotes || '',
        // Usar paymentStatus si viene desde OrderForm, sino calcularlo
        paymentStatus: formData.paymentStatus || (formData.paymentMethod === 'pending' ? 'pending' : 'partial'),
        orderStatus: 'recibidos',
        author: formData.author || '' // Asignar empleado seleccionado
      };

      const { addOrder } = await import('../services/firebaseService');
      await addOrder(newOrder);
      handleCloseModal();
      showSuccess('Orden creada exitosamente');
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error creating order:', error);
      showError('Error al crear la orden. Por favor intenta de nuevo.');
    }
  };

  const tabs = [
    { key: 'recibidos', label: 'Recibidos', icon: '📥', color: '#3b82f6' },
    { key: 'proceso', label: 'En Proceso', icon: '🔧', color: '#f59e0b' },
    { key: 'listos', label: 'Listos', icon: '✅', color: '#10b981' },
    { key: 'enEntrega', label: 'En Entrega', icon: '🚚', color: '#8b5cf6' }
  ];

  const currentOrders = filterOrders(orders[activeTab]).sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateB - dateA; // Descendente (más reciente primero)
  });

  return (
    <div className="orders-page">
      {/* Header */}
      <PageHeader
        title="Órdenes"
        buttonLabel="Nueva Orden"
        buttonIcon="➕"
        onButtonClick={handleOpenNewOrder}
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por cliente, orden o teléfono..."
      />

      {/* Status Tabs */}
      <div className="status-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`status-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            style={{
              '--tab-color': tab.color
            }}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            <span className="tab-count">{filterOrders(orders[tab.key]).length}</span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <h3>Cargando órdenes...</h3>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h3>Error al cargar órdenes</h3>
            <p>{error}</p>
          </div>
        ) : currentOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No hay órdenes</h3>
            <p>No se encontraron órdenes en esta categoría</p>
          </div>
        ) : (
          <>
            {currentOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                activeTab={activeTab}
                onOrderClick={handleOrderClick}
              />
            ))}
          </>
        )}
      </div>

      {/* Modal for New Order or Order Detail */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedOrder ? undefined : 'Nueva Orden'}
        headerContent={selectedOrder && headerData ? (
          <div className="order-detail-modal-header">
            <div className="order-header-main">
              <span className="order-header-number">Orden #{headerData.orderNumber}</span>
              <span className="order-header-client">{headerData.client}</span>
              <span className="order-header-date">Recibida {headerData.createdAt}</span>
            </div>
            <div className="order-header-author">
              <select
                className="order-header-author-select"
                value={headerData.author}
                onChange={headerData.onAuthorChange}
                onClick={(e) => e.stopPropagation()}
                disabled={headerData.isReadOnly}
                style={{
                  opacity: headerData.isReadOnly ? 0.6 : 1,
                  cursor: headerData.isReadOnly ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">Sin autor</option>
                {headerData.activeEmployees?.map(employee => (
                  <option key={employee.id} value={employee.name}>
                    {employee.emoji ? `${employee.emoji} ` : ''}{employee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : undefined}
        size="large"
      >
        {selectedOrder ? (
          <OrderDetailView
            order={selectedOrder}
            currentTab={activeTab}
            onClose={handleCloseModal}
            onSave={handleSaveOrder}
            onCancel={handleCancelOrder}
            onEmail={handleEmail}
            onWhatsApp={handleWhatsApp}
            onEntregar={handleEntregar}
            onBeforeClose={(fn) => { saveOnCloseRef.current = fn; }}
            renderHeader={setHeaderData}
            employees={employees}
          />
        ) : (
          isSmartphone ? (
            <OrderFormMobile
              onSubmit={handleSubmitOrder}
              onCancel={handleCloseModal}
              initialData={null}
              employees={employees}
              allOrders={orders}
            />
          ) : (
            <OrderForm
              onSubmit={handleSubmitOrder}
              onCancel={handleCloseModal}
              initialData={null}
              employees={employees}
              allOrders={orders}
            />
          )
        )}
      </Modal>

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
  );
};

export default Orders;
