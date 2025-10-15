import { useState } from 'react';
import Modal from '../components/Modal';
import OrderForm from '../components/OrderForm';
import OrderDetailView from '../components/OrderDetailView';
import OrderCard from '../components/OrderCard';
import PageHeader from '../components/PageHeader';
import { mockOrders } from '../data/mockData';
import './Orders.css';

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('recibidos');

  const [orders, setOrders] = useState(mockOrders);

  const handleStatusChange = (order, newStatus) => {
    // Find which column the order is currently in
    let sourceColumn = null;
    for (const [key, ordersList] of Object.entries(orders)) {
      if (ordersList.find(o => o.id === order.id)) {
        sourceColumn = key;
        break;
      }
    }

    if (sourceColumn === newStatus) return;

    // Remove from source column and add to target column
    setOrders(prev => ({
      ...prev,
      [sourceColumn]: prev[sourceColumn].filter(o => o.id !== order.id),
      [newStatus]: [...prev[newStatus], order]
    }));
  };

  const filterOrders = (ordersList) => {
    if (!searchTerm) return ordersList;

    return ordersList.filter(order => {
      const searchLower = searchTerm.toLowerCase();

      // Buscar en campos básicos
      const basicMatch =
        order.client.toLowerCase().includes(searchLower) ||
        order.phone.includes(searchLower) ||
        order.id.includes(searchLower);

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
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
  };

  const generateOrderId = () => {
    // Get all orders from all columns
    const allOrders = [...orders.recibidos, ...orders.proceso, ...orders.listos];

    // Find the highest ID number
    const maxId = allOrders.reduce((max, order) => {
      const idNum = parseInt(order.id);
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
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleSaveOrder = (updatedOrder) => {
    setOrders(prev => {
      const newOrders = { ...prev };
      for (const [key, ordersList] of Object.entries(newOrders)) {
        const index = ordersList.findIndex(o => o.id === updatedOrder.id);
        if (index !== -1) {
          newOrders[key] = [
            ...ordersList.slice(0, index),
            updatedOrder,
            ...ordersList.slice(index + 1)
          ];
          break;
        }
      }
      return newOrders;
    });
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      recibidos: { label: 'Recibidos', icon: '📥', color: '#3b82f6' },
      proceso: { label: 'En Proceso', icon: '🔧', color: '#f59e0b' },
      listos: { label: 'Listos', icon: '✅', color: '#10b981' }
    };
    return statusMap[status] || statusMap.recibidos;
  };

  const handleCancelOrder = (order) => {
    if (confirm(`¿Estás seguro de cancelar la orden #${order.id}?`)) {
      // Remove order from all columns
      setOrders(prev => {
        const newOrders = { ...prev };
        for (const key of Object.keys(newOrders)) {
          newOrders[key] = newOrders[key].filter(o => o.id !== order.id);
        }
        return newOrders;
      });
      handleCloseModal();
    }
  };

  const handleEmail = (order) => {
    // TODO: Implementar envío de correo
    alert(`Enviar correo a ${order.client}\nSe seleccionará plantilla según etapa de la orden`);
  };

  const handleWhatsApp = (order) => {
    const phone = order.phone.replace(/\D/g, '');
    const message = `Hola ${order.client}, tu orden #${order.id} está lista!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleInvoice = (order) => {
    // TODO: Implementar generación de factura
    alert(`Generar factura para orden #${order.id}\nCliente: ${order.client}\nTotal: $${order.price}`);
  };

  const handleSubmitOrder = (formData) => {
    const deliveryInfo = formatDeliveryDate(formData.deliveryDate);

    if (editingOrder) {
      // Edit existing order
      const updatedOrder = {
        ...editingOrder,
        client: formData.client,
        phone: formData.phone,
        model: formData.model,
        service: formData.service,
        price: formData.price,
        deliveryDate: deliveryInfo.text,
        priority: formData.priority,
        dateClass: deliveryInfo.className,
        notes: formData.notes
      };

      // Find which column has the order and update it
      setOrders(prev => {
        const newOrders = { ...prev };
        for (const [key, ordersList] of Object.entries(newOrders)) {
          const index = ordersList.findIndex(o => o.id === editingOrder.id);
          if (index !== -1) {
            newOrders[key] = [
              ...ordersList.slice(0, index),
              updatedOrder,
              ...ordersList.slice(index + 1)
            ];
            break;
          }
        }
        return newOrders;
      });
    } else {
      // Create new order
      const newOrder = {
        id: generateOrderId(),
        client: formData.client,
        phone: formData.phone,
        model: formData.model,
        service: formData.service,
        price: formData.price,
        deliveryDate: deliveryInfo.text,
        priority: formData.priority,
        dateClass: deliveryInfo.className,
        notes: formData.notes
      };

      // Add to "Recibidos" column
      setOrders(prev => ({
        ...prev,
        recibidos: [newOrder, ...prev.recibidos]
      }));
    }

    handleCloseModal();
  };

  const tabs = [
    { key: 'recibidos', label: 'Recibidos', icon: '📥', color: '#3b82f6' },
    { key: 'proceso', label: 'En Proceso', icon: '🔧', color: '#f59e0b' },
    { key: 'listos', label: 'Listos', icon: '✅', color: '#10b981' }
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
        {currentOrders.length === 0 ? (
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

      {/* Modal for New/Edit Order */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingOrder ? `Orden #${editingOrder.id}` : 'Nueva Orden'}
        size="large"
      >
        {editingOrder ? (
          <OrderDetailView
            order={editingOrder}
            onClose={handleCloseModal}
            onSave={handleSaveOrder}
            onCancel={handleCancelOrder}
            onEmail={handleEmail}
            onWhatsApp={handleWhatsApp}
            onInvoice={handleInvoice}
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
