import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import OrderForm from '../components/OrderForm';
import OrderDetailView from '../components/OrderDetailView';
import OrderCard from '../components/OrderCard';
import PageHeader from '../components/PageHeader';
import {
  subscribeToOrders,
  updateOrder,
  updateOrderStatus,
  deleteOrder
} from '../services/firebaseService';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('recibidos');
  const [orders, setOrders] = useState(EMPTY_ORDERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleStatusChange = async (order, newStatus) => {
    try {
      await updateOrderStatus(order.id, newStatus);
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error al actualizar el estado de la orden');
    }
  };

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
    try {
      await updateOrder(updatedOrder.id, updatedOrder);
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Error al guardar la orden');
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

  const handleCancelOrder = async (order) => {
    if (confirm(`¿Estás seguro de cancelar la orden #${order.orderNumber || order.id}?`)) {
      try {
        await deleteOrder(order.id);
        handleCloseModal();
        // Real-time listener will update the UI automatically
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Error al eliminar la orden');
      }
    }
  };

  const handleEmail = (order) => {
    // TODO: Implementar envío de correo
    alert(`Enviar correo a ${order.client}\nSe seleccionará plantilla según etapa de la orden`);
  };

  const handleWhatsApp = (order) => {
    const phone = order.phone.replace(/\D/g, '');
    const message = `Hola ${order.client}, tu orden #${order.orderNumber || order.id} está lista!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleInvoice = (order) => {
    // TODO: Implementar generación de factura
    alert(`Generar factura para orden #${order.orderNumber || order.id}\nCliente: ${order.client}\nTotal: $${order.price}`);
  };

  const handleCobrar = async (order) => {
    // TODO: Integrar con Clip para procesar pago
    const totalPrice = order.totalPrice || 0;
    const advancePayment = parseFloat(order.advancePayment) || 0;
    const remainingPayment = totalPrice - advancePayment;

    if (confirm(`¿Cobrar $${remainingPayment} a ${order.client}?`)) {
      try {
        // Marcar como pagado completamente
        const updatedOrder = {
          ...order,
          paymentStatus: 'paid',
          paymentMethod: 'cash' // Actualizar método de pago a efectivo
        };

        await handleSaveOrder(updatedOrder);
        alert('Pago registrado exitosamente');
      } catch (error) {
        console.error('Error processing payment:', error);
        alert('Error al procesar el pago');
      }
    }
  };

  const handleEntregar = async (order) => {
    if (confirm(`¿Marcar orden #${order.orderNumber || order.id} como entregada?`)) {
      try {
        // Actualizar orden con estado completado
        const completedOrder = {
          ...order,
          orderStatus: 'completados',
          completedDate: new Date().toISOString()
        };

        await updateOrder(order.id, completedOrder);
        handleCloseModal();
        alert(`Orden #${order.orderNumber || order.id} entregada exitosamente`);
        // Real-time listener will update the UI automatically
      } catch (error) {
        console.error('Error marking order as delivered:', error);
        alert('Error al marcar la orden como entregada');
      }
    }
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
        orderImages: formData.orderImages || [],
        totalPrice: formData.totalPrice || 0,
        deliveryDate: formData.deliveryDate,
        priority: formData.priority || '',
        paymentMethod: formData.paymentMethod || 'pending',
        advancePayment: formData.advancePayment || 0,
        generalNotes: formData.generalNotes || '',
        paymentStatus: formData.paymentMethod === 'pending' ? 'pending' : 'partial',
        orderStatus: 'recibidos'
      };

      const { addOrder } = await import('../services/firebaseService');
      await addOrder(newOrder);
      handleCloseModal();
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error al crear la orden');
    }
  };

  const tabs = [
    { key: 'recibidos', label: 'Recibidos', icon: '📥', color: '#3b82f6' },
    { key: 'proceso', label: 'En Proceso', icon: '🔧', color: '#f59e0b' },
    { key: 'listos', label: 'Listos', icon: '✅', color: '#10b981' },
    { key: 'enEntrega', label: 'En Entrega', icon: '🚚', color: '#8b5cf6' }
  ];

  const currentOrders = filterOrders(orders[activeTab]);

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
          currentOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              activeTab={activeTab}
              onOrderClick={handleOrderClick}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      {/* Modal for New Order or Order Detail */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedOrder ? `Orden #${selectedOrder.orderNumber || selectedOrder.id}` : 'Nueva Orden'}
        size="large"
      >
        {selectedOrder ? (
          <OrderDetailView
            order={selectedOrder}
            currentTab={activeTab}
            onClose={handleCloseModal}
            onSave={handleSaveOrder}
            onStatusChange={handleStatusChange}
            onCancel={handleCancelOrder}
            onEmail={handleEmail}
            onWhatsApp={handleWhatsApp}
            onInvoice={handleInvoice}
            onCobrar={handleCobrar}
            onEntregar={handleEntregar}
          />
        ) : (
          <OrderForm
            onSubmit={handleSubmitOrder}
            onCancel={handleCloseModal}
            initialData={null}
          />
        )}
      </Modal>
    </div>
  );
};

export default Orders;
