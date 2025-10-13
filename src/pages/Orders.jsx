import { useState } from 'react';
import Modal from '../components/Modal';
import OrderForm from '../components/OrderForm';
import OrderDetailView from '../components/OrderDetailView';
import './Orders.css';

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('recibidos');

  const [orders, setOrders] = useState({
    recibidos: [
      {
        id: '00125',
        client: 'Carlos López',
        phone: '555-123-4567',
        model: 'Jordan 1 Retro High',
        service: 'Restauración Completa',
        price: '400',
        deliveryDate: 'Entrega: 10 Oct',
        priority: '',
        dateClass: '',
        images: ['/tenis.png', '/tenis.png', '/tenis.png']
      },
      {
        id: '00130',
        client: 'Laura Mendoza',
        phone: '555-789-0123',
        model: 'Reebok Club C',
        service: 'Lavado Básico',
        price: '150',
        deliveryDate: 'Entrega: 12 Oct',
        priority: '',
        dateClass: '',
        images: ['/tenis.png', '/tenis.png']
      },
      {
        id: '00135',
        client: 'Miguel Ángel',
        phone: '555-456-7890',
        model: 'Nike Dunk Low',
        service: 'Lavado Express',
        price: '100',
        deliveryDate: 'Entrega: Mañana',
        priority: 'high',
        dateClass: 'urgent',
        images: ['/tenis.png']
      },
      {
        id: '00136',
        client: 'Sandra Rivera',
        phone: '555-321-6540',
        model: 'Adidas Stan Smith',
        service: 'Lavado Profundo',
        price: '250',
        deliveryDate: 'Entrega: 15 Oct',
        priority: '',
        dateClass: '',
        images: []
      }
    ],
    proceso: [
      {
        id: '00124',
        client: 'María García',
        phone: '098-765-4321',
        model: 'Adidas Superstar',
        service: 'Lavado Básico',
        price: '150',
        deliveryDate: 'Entrega: 8 Oct',
        priority: '',
        dateClass: '',
        images: ['/tenis.png', '/tenis.png']
      },
      {
        id: '00127',
        client: 'Luis Ramírez',
        phone: '555-246-8135',
        model: 'Vans Old Skool',
        service: 'Lavado Profundo',
        price: '250',
        deliveryDate: 'Entrega: Mañana',
        priority: '',
        dateClass: 'soon',
        images: ['/tenis.png']
      },
      {
        id: '00132',
        client: 'Sofía Torres',
        phone: '555-159-7530',
        model: 'Air Force 1',
        service: 'Restauración',
        price: '350',
        deliveryDate: 'Entrega: 11 Oct',
        priority: '',
        dateClass: '',
        images: ['/tenis.png', '/tenis.png', '/tenis.png']
      }
    ],
    listos: [
      {
        id: '00123',
        client: 'Juan Pérez',
        phone: '123-456-7890',
        model: 'Nike Air Max 90',
        service: 'Lavado Profundo',
        price: '250',
        deliveryDate: 'Entrega: Hoy',
        priority: 'high',
        dateClass: 'urgent',
        images: ['/tenis.png', '/tenis.png']
      },
      {
        id: '00126',
        client: 'Ana Martínez',
        phone: '555-987-6543',
        model: 'Puma RS-X',
        service: 'Lavado Express',
        price: '100',
        deliveryDate: 'Entrega: Hoy',
        priority: 'high',
        dateClass: 'urgent',
        images: ['/tenis.png']
      },
      {
        id: '00128',
        client: 'Patricia Sánchez',
        phone: '555-369-2580',
        model: 'Converse Chuck Taylor',
        service: 'Lavado Básico',
        price: '150',
        deliveryDate: 'Entrega: Hoy',
        priority: 'high',
        dateClass: 'urgent',
        images: ['/tenis.png', '/tenis.png', '/tenis.png']
      },
      {
        id: '00133',
        client: 'Fernando Cruz',
        phone: '555-147-8520',
        model: 'Asics Gel-Lyte III',
        service: 'Lavado Básico',
        price: '150',
        deliveryDate: 'Entrega: Mañana',
        priority: '',
        dateClass: 'soon',
        images: []
      },
      {
        id: '00134',
        client: 'Isabel Ramos',
        phone: '555-753-9510',
        model: 'Saucony Shadow',
        service: 'Lavado Profundo',
        price: '250',
        deliveryDate: 'Entrega: 8 Oct',
        priority: '',
        dateClass: '',
        images: ['/tenis.png', '/tenis.png']
      }
    ]
  });

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
      return (
        order.client.toLowerCase().includes(searchLower) ||
        order.phone.includes(searchLower) ||
        order.id.includes(searchLower) ||
        order.model.toLowerCase().includes(searchLower)
      );
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
      <div className="page-header">
        <div className="header-top">
          <h1 className="page-title">Órdenes</h1>
          <button className="btn-new-order" onClick={handleOpenNewOrder}>
            ➕ Nueva Orden
          </button>
        </div>

        {/* Search and Filters */}
        <div className="controls">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por cliente, orden o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="filter-btn">📅 Fecha</button>
          <button className="filter-btn">💰 Pago</button>
          <button className="filter-btn">🔧 Servicio</button>
        </div>
      </div>

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
            <div
              key={order.id}
              className="order-row"
              onClick={() => handleOrderClick(order)}
            >
              <div className="order-main-info">
                <div className="order-id-section">
                  <span className="order-id">#{order.id}</span>
                  {order.priority === 'high' && (
                    <span className="priority-badge">⚡ Urgente</span>
                  )}
                </div>
                <div className="order-client-info">
                  <div className="client-name">{order.client}</div>
                  <div className="client-phone">{order.phone}</div>
                </div>
              </div>

              <div className="order-details">
                <div className="order-detail-item">
                  <span className="detail-label">Modelo</span>
                  <span className="detail-value">{order.model}</span>
                </div>
                <div className="order-detail-item">
                  <span className="detail-label">Servicio</span>
                  <span className="detail-value">{order.service}</span>
                </div>
                <div className="order-detail-item">
                  <span className="detail-label">Precio</span>
                  <span className="detail-value price">${order.price}</span>
                </div>
                <div className="order-detail-item">
                  <span className={`delivery-date ${order.dateClass}`}>
                    {order.deliveryDate}
                  </span>
                </div>
              </div>

              <div className="order-actions">
                <select
                  className="status-selector"
                  value={activeTab}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleStatusChange(order, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="recibidos">📥 Recibidos</option>
                  <option value="proceso">🔧 En Proceso</option>
                  <option value="listos">✅ Listos</option>
                </select>
                <button
                  className="btn-view-order"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOrderClick(order);
                  }}
                >
                  Ver
                </button>
              </div>
            </div>
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
