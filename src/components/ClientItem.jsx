import { useState, useEffect, useMemo } from 'react';
import { subscribeToOrders } from '../services/firebaseService';
import './ClientItem.css';

const ClientItem = ({ client, onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all');

  const getInitials = (name) => {
    const names = name.split(' ');
    return names.map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Nunca';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Hace 1 día';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    if (diffInDays < 14) return 'Hace 1 semana';
    if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`;
    if (diffInDays < 60) return 'Hace 1 mes';
    if (diffInDays < 365) return `Hace ${Math.floor(diffInDays / 30)} meses`;
    return `Hace ${Math.floor(diffInDays / 365)} años`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Subscribe to orders and filter by client
  useEffect(() => {
    const unsubscribe = subscribeToOrders((ordersData) => {
      // Get all active orders (not completed)
      const allActiveOrders = [
        ...(ordersData.recibidos || []),
        ...(ordersData.proceso || []),
        ...(ordersData.listos || []),
        ...(ordersData.enEntrega || [])
      ];

      // Get completed orders
      const allCompletedOrders = ordersData.completados || [];

      // Filter orders by this client's name
      const clientActiveOrders = allActiveOrders.filter(
        order => order.client === client.name
      );

      const clientCompletedOrders = allCompletedOrders.filter(
        order => order.client === client.name
      );

      // Ordenar por fecha de creación (más reciente primero)
      const sortedActiveOrders = clientActiveOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // Descendente (más reciente primero)
      });

      const sortedCompletedOrders = clientCompletedOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // Descendente (más reciente primero)
      });

      setActiveOrders(sortedActiveOrders);
      setCompletedOrders(sortedCompletedOrders);
    });

    return () => unsubscribe();
  }, [client.name]);

  // Group services by icon and count them
  const getServiceIcons = (services) => {
    if (!services || services.length === 0) return null;

    const grouped = {};
    services.forEach(service => {
      const icon = service.icon || '🧼';
      grouped[icon] = (grouped[icon] || 0) + 1;
    });

    return Object.entries(grouped).map(([icon, count]) => (
      <span key={icon} className="service-icon">
        {icon}{count > 1 ? ` ${count}` : ''}
      </span>
    ));
  };

  const handleToggleHistory = (e) => {
    e.stopPropagation(); // Prevent triggering onClick for editing client
    setIsExpanded(!isExpanded);
  };

  // Filter orders based on history filter
  const filteredOrders = useMemo(() => {
    let orders = [];
    if (historyFilter === 'active') {
      orders = activeOrders;
    } else if (historyFilter === 'completed') {
      orders = completedOrders;
    } else {
      orders = [...activeOrders, ...completedOrders];
    }

    // Ordenar por fecha de creación (más reciente primero)
    return orders.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
  }, [historyFilter, activeOrders, completedOrders]);

  const hasDebt = client.debt > 0;

  return (
    <div className="client-item-wrapper">
      <div className="client-item" onClick={() => onClick && onClick(client)}>
        <div className={`client-avatar ${client.isVip ? 'vip' : ''}`}>
          {getInitials(client.name)}
        </div>
        <div className="client-info">
          <div className="client-name">{client.name}</div>
          <div className="client-phone">{client.phone}</div>
        </div>
        <div className="client-meta">
          <div className="client-meta-item">
            <div className="client-meta-value">{client.orders}</div>
            <div className="client-meta-label">Órdenes</div>
          </div>
          <div className="client-meta-item">
            <div className={`client-meta-value ${hasDebt ? 'debt' : ''}`}>
              ${client.debt}
            </div>
            <div className="client-meta-label">Debe</div>
          </div>
        </div>
        <div className="client-last-visit">{getRelativeTime(client.lastVisit)}</div>
        <div className="client-actions">
          <button
            className={`btn-action active-order ${!client.isActive ? 'invisible' : ''}`}
            title={client.isActive ? "Tiene zapatos en el negocio" : ""}
            disabled={!client.isActive}
          >
            👟
          </button>
          <button
            className="btn-view-history"
            onClick={handleToggleHistory}
            title="Ver historial de órdenes"
          >
            Ver Historial
          </button>
          <button className="btn-action whatsapp" title="WhatsApp (próximamente)">💬</button>
        </div>
      </div>

      {/* Expanded History Section */}
      {isExpanded && (
        <div className="client-history-section">
          <div className="history-header">
            <h4>Historial de Órdenes de {client.name}</h4>
            <div className="history-filters">
              <button
                className={historyFilter === 'all' ? 'active' : ''}
                onClick={() => setHistoryFilter('all')}
              >
                Todas ({activeOrders.length + completedOrders.length})
              </button>
              <button
                className={historyFilter === 'active' ? 'active' : ''}
                onClick={() => setHistoryFilter('active')}
              >
                Activas ({activeOrders.length})
              </button>
              <button
                className={historyFilter === 'completed' ? 'active' : ''}
                onClick={() => setHistoryFilter('completed')}
              >
                Completadas ({completedOrders.length})
              </button>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="no-orders">
              <p>No hay órdenes para mostrar</p>
            </div>
          ) : (
            <div className="client-orders-list">
              {filteredOrders.map((order) => (
                <div key={order.id} className="order-item">
                  <div className="order-info">
                    <span className="order-number">#{order.orderNumber || order.id?.substring(0, 8)}</span>
                    <span className="order-date">
                      {formatDate(order.completedDate || order.deliveryDate)}
                    </span>
                  </div>
                  <div className="order-details">
                    <span className={`order-status status-${order.orderStatus}`}>
                      {order.orderStatus === 'recibidos' && '📥 Recibidos'}
                      {order.orderStatus === 'proceso' && '🔧 En Proceso'}
                      {order.orderStatus === 'listos' && '✅ Listos'}
                      {order.orderStatus === 'enEntrega' && '🚚 En Entrega'}
                      {order.orderStatus === 'completados' && '✅ Completado'}
                    </span>
                    <div className="order-services">
                      {getServiceIcons(order.services)}
                    </div>
                    <span className="order-total">${order.totalPrice}</span>
                    <span className={`payment-status status-${order.paymentStatus}`}>
                      {order.paymentStatus === 'paid' && '✓ Pagado'}
                      {order.paymentStatus === 'partial' && '⚠ Parcial'}
                      {order.paymentStatus === 'pending' && '⏳ Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientItem;
