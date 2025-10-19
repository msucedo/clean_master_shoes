import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import OrderCard from '../components/OrderCard';
import Modal from '../components/Modal';
import OrderDetailView from '../components/OrderDetailView';
import { subscribeToOrders, updateOrder, updateOrderStatus } from '../services/firebaseService';
import './Dashboard.css';

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState({
    recibidos: [],
    proceso: [],
    listos: [],
    enEntrega: [],
    completados: []
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time orders updates
  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToOrders((ordersData) => {
      setOrders(ordersData);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Obtener fecha dinámica
  const getCurrentDate = () => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const today = new Date();
    const dayName = days[today.getDay()];
    const day = today.getDate();
    const month = months[today.getMonth()];
    const year = today.getFullYear();

    return `${dayName}, ${day} de ${month} ${year}`;
  };

  const handleNewOrder = () => {
    console.log('Open new order form');
  };

  // Filtrar órdenes para entregar hoy (de todas las columnas)
  const getTodayDeliveries = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = [];

    // Recorrer todas las columnas y agregar el status a cada orden
    const columns = {
      recibidos: orders.recibidos || [],
      proceso: orders.proceso || [],
      listos: orders.listos || [],
      enEntrega: orders.enEntrega || []
    };

    for (const [status, ordersList] of Object.entries(columns)) {
      ordersList.forEach(order => {
        if (!order.deliveryDate) return;

        const [year, month, day] = order.deliveryDate.split('-').map(Number);
        const deliveryDate = new Date(year, month - 1, day);
        deliveryDate.setHours(0, 0, 0, 0);

        if (deliveryDate.getTime() === today.getTime()) {
          // Agregar el status actual de la orden
          todayOrders.push({ ...order, currentStatus: status });
        }
      });
    }

    return todayOrders;
  };

  const todayDeliveries = getTodayDeliveries();

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
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

  const handleStatusChange = async (order, newStatus) => {
    try {
      await updateOrderStatus(order.id, newStatus);
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error al actualizar el estado de la orden');
    }
  };

  const handleCobrar = async (order) => {
    const totalPrice = order.totalPrice || 0;
    const advancePayment = parseFloat(order.advancePayment) || 0;
    const remainingPayment = totalPrice - advancePayment;

    if (confirm(`¿Cobrar $${remainingPayment} a ${order.client}?`)) {
      try {
        const updatedOrder = {
          ...order,
          paymentStatus: 'paid',
          paymentMethod: 'cash'
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
        const completedOrder = {
          ...order,
          orderStatus: 'completados',
          completedDate: new Date().toISOString(),
          paymentStatus: 'paid',
          paymentMethod: order.paymentMethod === 'pending' ? 'cash' : order.paymentMethod
        };

        await updateOrder(order.id, completedOrder);
        handleCloseModal();
        alert(`Orden #${order.orderNumber || order.id} entregada exitosamente`);
      } catch (error) {
        console.error('Error marking order as delivered:', error);
        alert('Error al entregar la orden');
      }
    }
  };

  const handleCancelOrder = async (order) => {
    if (confirm(`¿Estás seguro de cancelar la orden #${order.orderNumber || order.id}?`)) {
      try {
        const cancelledOrder = {
          ...order,
          orderStatus: 'completados',
          cancelledDate: new Date().toISOString()
        };

        await updateOrder(order.id, cancelledOrder);
        handleCloseModal();
        alert('Orden cancelada');
      } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Error al cancelar la orden');
      }
    }
  };

  const handleEmail = (order) => {
    alert(`Enviar correo a ${order.client}\nSe seleccionará plantilla según etapa de la orden`);
  };

  const handleWhatsApp = (order) => {
    const phone = order.phone.replace(/\D/g, '');
    const message = `Hola ${order.client}, tu orden #${order.orderNumber || order.id} está lista!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleInvoice = (order) => {
    alert(`Generar factura para orden #${order.orderNumber || order.id}\nCliente: ${order.client}`);
  };

  // Calcular pagos pendientes (órdenes con pago pendiente o parcial)
  const getPendingPayments = () => {
    const allActiveOrders = [
      ...(orders.recibidos || []),
      ...(orders.proceso || []),
      ...(orders.listos || []),
      ...(orders.enEntrega || [])
    ];

    return allActiveOrders.filter(order =>
      order.paymentStatus === 'pending' || order.paymentStatus === 'partial'
    ).length;
  };

  // Calcular ingresos de hoy (órdenes completadas hoy)
  const getTodayIncome = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedOrders = orders.completados || [];

    const todayCompletedOrders = completedOrders.filter(order => {
      if (!order.completedDate) return false;

      const completedDate = new Date(order.completedDate);
      completedDate.setHours(0, 0, 0, 0);

      return completedDate.getTime() === today.getTime();
    });

    const totalIncome = todayCompletedOrders.reduce((total, order) => {
      return total + (order.totalPrice || 0);
    }, 0);

    return totalIncome;
  };

  // Calcular órdenes recibidas hoy
  const getOrdersReceivedToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allOrders = [
      ...(orders.recibidos || []),
      ...(orders.proceso || []),
      ...(orders.listos || []),
      ...(orders.enEntrega || []),
      ...(orders.completados || [])
    ];

    return allOrders.filter(order => {
      if (!order.createdAt) return false;

      const createdDate = new Date(order.createdAt);
      createdDate.setHours(0, 0, 0, 0);

      return createdDate.getTime() === today.getTime();
    }).length;
  };

  // Calcular total de órdenes activas (no completadas)
  const getTotalActiveOrders = () => {
    const allActiveOrders = [
      ...(orders.recibidos || []),
      ...(orders.proceso || []),
      ...(orders.listos || []),
      ...(orders.enEntrega || [])
    ];

    return allActiveOrders.length;
  };

  // Calcular órdenes completadas esta semana
  const getCompletedThisWeek = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtener el lunes de esta semana
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const completedOrders = orders.completados || [];

    return completedOrders.filter(order => {
      if (!order.completedDate) return false;

      const completedDate = new Date(order.completedDate);
      completedDate.setHours(0, 0, 0, 0);

      return completedDate.getTime() >= monday.getTime();
    }).length;
  };

  const pendingPayments = getPendingPayments();
  const todayIncome = getTodayIncome();
  const ordersReceivedToday = getOrdersReceivedToday();
  const totalActiveOrders = getTotalActiveOrders();
  const completedThisWeek = getCompletedThisWeek();

  const stats = [
    { icon: '📦', label: 'Para Entregar', value: (orders.enEntrega?.length || 0).toString(), type: 'entregas' },
    { icon: '🔄', label: 'En Proceso', value: (orders.proceso?.length || 0).toString(), type: 'proceso' },
    { icon: '💰', label: 'Pagos Pendientes', value: pendingPayments.toString(), type: 'pagos' },
    { icon: '💵', label: 'Ingresos Hoy', value: `$${todayIncome}`, type: 'ingresos' },
    { icon: '📥', label: 'Órdenes Recibidas Hoy', value: ordersReceivedToday.toString(), type: 'recibidas' },
    { icon: '✅', label: 'Órdenes Listas', value: (orders.listos?.length || 0).toString(), type: 'listos' },
    { icon: '📊', label: 'Total Órdenes Activas', value: totalActiveOrders.toString(), type: 'activas' },
    { icon: '🎯', label: 'Completadas Esta Semana', value: completedThisWeek.toString(), type: 'completadas' },
  ];

  return (
    <div className="dashboard">
      {/* Header with welcome message */}
      <div className="hero-section">
        <div className="welcome-text">
          <div className="welcome-greeting">{getCurrentDate()}</div>
          <h1 className="welcome-title">Bienvenido de nuevo</h1>
        </div>
      </div>


      {/* Quick Stats */}
      <div className="quick-stats">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Priority Tasks */}
      <div className="priority-section">
        {/* Entregas de Hoy */}
        <div className="task-group">
          <div className="task-group-header">
            <div className="task-group-icon entregas">📦</div>
            <div className="task-group-title-wrapper">
              <div className="task-group-name">Entregas Programadas para Hoy</div>
              <div className="task-group-count">{todayDeliveries.length} {todayDeliveries.length === 1 ? 'cliente esperando' : 'clientes esperando'}</div>
            </div>
          </div>
          <div className="task-cards">
            {todayDeliveries.length === 0 ? (
              <div className="empty-state">
                <p>No hay entregas programadas para hoy</p>
              </div>
            ) : (
              todayDeliveries.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onOrderClick={handleOrderClick}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal para ver detalle de orden */}
      {selectedOrder && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={`Orden #${selectedOrder.orderNumber || selectedOrder.id}`}
          size="large"
        >
          <OrderDetailView
            order={selectedOrder}
            currentTab={selectedOrder.currentStatus}
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
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
