import { useState, useEffect } from 'react';
import { subscribeToOrders, updateOrder } from '../services/firebaseService';
import './EmpleadoItem.css';

const EmpleadoItem = ({ empleado, onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAssignOrders, setShowAssignOrders] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]);
  const [unassignedOrders, setUnassignedOrders] = useState([]);
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

  const isActive = empleado.status === 'active';

  // Subscribe to orders and filter by employee
  useEffect(() => {
    const unsubscribe = subscribeToOrders((ordersData) => {
      // Get all active orders (not completed)
      const allActiveOrders = [
        ...(ordersData.recibidos || []),
        ...(ordersData.proceso || []),
        ...(ordersData.listos || []),
        ...(ordersData.enEntrega || [])
      ];

      // Filter orders by this employee's name
      const employeeOrders = allActiveOrders.filter(
        order => order.author === empleado.name
      );

      setActiveOrders(employeeOrders);

      // Get unassigned orders in "recibidos" status
      const ordersWithoutEmployee = (ordersData.recibidos || []).filter(
        order => !order.author || order.author === ''
      );

      setUnassignedOrders(ordersWithoutEmployee);
    });

    return () => unsubscribe();
  }, [empleado.name]);

  const handleToggleOrders = (e) => {
    e.stopPropagation(); // Prevent triggering onClick for editing employee
    // Si se abre "Ver Órdenes", cerrar "Asignar Orden"
    if (!isExpanded && showAssignOrders) {
      setShowAssignOrders(false);
    }
    setIsExpanded(!isExpanded);
  };

  const handleToggleAssignOrders = (e) => {
    e.stopPropagation(); // Prevent triggering onClick for editing employee
    // Si se abre "Asignar Orden", cerrar "Ver Órdenes"
    if (!showAssignOrders && isExpanded) {
      setIsExpanded(false);
    }
    setShowAssignOrders(!showAssignOrders);
  };

  const handleAssignOrder = async (orderId) => {
    try {
      await updateOrder(orderId, { author: empleado.name });
      // La suscripción en tiempo real actualizará automáticamente las listas
    } catch (error) {
      console.error('Error asignando orden:', error);
    }
  };

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

  return (
    <div className="empleado-item-wrapper">
      <div className="empleado-item" onClick={() => onClick && onClick(empleado)}>
        <div className={`empleado-avatar ${!isActive ? 'inactive' : ''}`}>
          {getInitials(empleado.name)}
        </div>
        <div className="empleado-info">
          <div className="empleado-name">{empleado.name}</div>
          <div className="empleado-role">{empleado.role || 'Sin rol asignado'}</div>
        </div>
        <div className="empleado-meta">
          <div className="empleado-meta-item">
            <div className="empleado-meta-value">{empleado.phone}</div>
            <div className="empleado-meta-label">Teléfono</div>
          </div>
        </div>
        <div className="empleado-hire-date">{getRelativeTime(empleado.hireDate)}</div>
        <div className="empleado-status">
          <span className={`status-badge ${empleado.status || 'active'}`}>
            {empleado.status === 'active' ? 'Activo' : 'Inactivo'}
          </span>
          <button
            className="btn-view-orders"
            onClick={handleToggleOrders}
            title="Ver órdenes activas"
          >
            {isExpanded ? '▼' : '▶'} Ver Órdenes ({activeOrders.length})
          </button>
          <button
            className="btn-assign-order"
            onClick={handleToggleAssignOrders}
            title="Asignar órdenes sin empleado"
          >
            {showAssignOrders ? '▼' : '▶'} Asignar Orden ({unassignedOrders.length})
          </button>
        </div>
      </div>

      {/* Expanded Orders Section */}
      {isExpanded && (
        <div className="empleado-orders-section">
          <div className="orders-header">
            <h4>Órdenes Activas de {empleado.name}</h4>
          </div>
          {activeOrders.length === 0 ? (
            <div className="no-orders">
              <p>No hay órdenes activas asignadas a este empleado</p>
            </div>
          ) : (
            <div className="empleado-orders-list">
              {activeOrders.map((order) => (
                <div key={order.id} className="order-item">
                  <div className="order-info">
                    <span className="order-number">#{order.orderNumber || order.id}</span>
                    <span className="order-client">{order.client}</span>
                  </div>
                  <div className="order-details">
                    <span className={`order-status status-${order.orderStatus}`}>
                      {order.orderStatus === 'recibidos' && '📥 Recibidos'}
                      {order.orderStatus === 'proceso' && '🔧 En Proceso'}
                      {order.orderStatus === 'listos' && '✅ Listos'}
                      {order.orderStatus === 'enEntrega' && '🚚 En Entrega'}
                    </span>
                    <div className="order-services">
                      {getServiceIcons(order.services)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expanded Assign Orders Section */}
      {showAssignOrders && (
        <div className="empleado-orders-section">
          <div className="orders-header">
            <h4>Órdenes sin Asignar (Recibidos)</h4>
          </div>
          {unassignedOrders.length === 0 ? (
            <div className="no-orders">
              <p>No hay órdenes sin asignar en estado "Recibidos"</p>
            </div>
          ) : (
            <div className="empleado-orders-list">
              {unassignedOrders.map((order) => (
                <div key={order.id} className="order-item assign-order-item">
                  <div className="order-info">
                    <span className="order-number">#{order.orderNumber || order.id}</span>
                    <span className="order-client">{order.client}</span>
                  </div>
                  <div className="order-details">
                    <span className="order-status status-recibidos">
                      📥 Recibidos
                    </span>
                    <div className="order-services">
                      {getServiceIcons(order.services)}
                    </div>
                    <button
                      className="btn-assign-to-employee"
                      onClick={() => handleAssignOrder(order.id)}
                    >
                      ✓ Asignar
                    </button>
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

export default EmpleadoItem;
