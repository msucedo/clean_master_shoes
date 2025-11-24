import { useState, useEffect } from 'react';
import { subscribeToOrders, updateOrder } from '../services/firebaseService';
import AdminBadge from './AdminBadge';
import './EmpleadoItem.css';

const EmpleadoItem = ({ empleado, onClick, onOrderClick, showSuccess, showError }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAssignOrders, setShowAssignOrders] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]);
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
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

  const isDeliveryOverdue = (deliveryDateString) => {
    if (!deliveryDateString) return false;

    const [year, month, day] = deliveryDateString.split('-').map(Number);
    const deliveryDate = new Date(year, month - 1, day);
    const today = new Date();

    deliveryDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Retorna true si la fecha de entrega es anterior a hoy
    return deliveryDate.getTime() < today.getTime();
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

      // Filter orders by this employee's ID
      const employeeOrders = allActiveOrders
        .filter(order => order.authorId === empleado.id)
        .sort((a, b) => {
          // Primero ordenar por prioridad (high primero)
          if (a.priority === 'high' && b.priority !== 'high') return -1;
          if (a.priority !== 'high' && b.priority === 'high') return 1;

          // Si tienen la misma prioridad, ordenar por número de orden ascendente
          const orderNumA = a.orderNumber || 0;
          const orderNumB = b.orderNumber || 0;
          return orderNumA - orderNumB;
        });

      setActiveOrders(employeeOrders);

      // Get unassigned orders in "recibidos" status
      const ordersWithoutEmployee = (ordersData.recibidos || [])
        .filter(order => !order.authorId)
        .sort((a, b) => {
          // Primero ordenar por prioridad (high primero)
          if (a.priority === 'high' && b.priority !== 'high') return -1;
          if (a.priority !== 'high' && b.priority === 'high') return 1;

          // Si tienen la misma prioridad, ordenar por número de orden descendente
          const orderNumA = a.orderNumber || 0;
          const orderNumB = b.orderNumber || 0;
          return orderNumB - orderNumA;
        });

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

  const handleAssignOrder = async (order) => {
    try {
      await updateOrder(order.id, {
        author: empleado.name,
        authorId: empleado.id,
        orderStatus: 'proceso'
      });
      showSuccess(`Orden #${parseInt(order.orderNumber, 10)} asignada a ${empleado.name} y puesta en proceso ✓`);
      // La suscripción en tiempo real actualizará automáticamente las listas
    } catch (error) {
      console.error('Error asignando orden:', error);
      showError('Error al asignar orden. Por favor intenta de nuevo.');
    }
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
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
        <div className={`empleado-avatar ${!isActive ? 'inactive' : ''} ${empleado.emoji ? 'with-emoji' : ''}`}>
          {empleado.emoji || getInitials(empleado.name)}
        </div>
        <div className="empleado-info">
          <div className="empleado-name">
            {empleado.name}
            {empleado.isAdmin && <AdminBadge inline small />}
          </div>
          <div className="empleado-role">{empleado.role || 'Sin rol asignado'}</div>
        </div>
        <div className="empleado-meta">
          <div className="empleado-meta-item">
            <div className="empleado-meta-value">{empleado.phone}</div>
            <div className="empleado-meta-label">Teléfono</div>
          </div>
          <span className={`status-badge ${empleado.status || 'active'}`}>
            {empleado.status === 'active' ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <div className="empleado-hire-date">{getRelativeTime(empleado.hireDate)}</div>
        <div className="empleado-status">
          
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
                <div
                  key={order.id}
                  className={`empleado-order-item ${isDeliveryOverdue(order.deliveryDate) ? 'overdue' : ''}`}
                  onClick={() => onOrderClick && onOrderClick({ ...order, currentStatus: order.orderStatus })}
                  style={{ cursor: 'pointer' }}
                  title="Click para ver detalles de la orden"
                >
                  <div className="empleado-order-info">
                    <span className="empleado-order-number">#{parseInt(order.orderNumber, 10)}</span>
                    {order.priority === 'high' && (
                      <div className="order-priority-badge">Urgente</div>
                    )}
                    <span className="empleado-order-client">{order.client}</span>
                  </div>
                  <div className="empleado-order-details">
                    {order.orderImages && order.orderImages.length > 0 && (
                      <img
                        src={order.orderImages[0]}
                        alt="Orden"
                        className="empleado-order-thumbnail"
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(order.orderImages[0]);
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                    <span className="empleado-order-created-date">
                      <span>Recibido </span>
                      {getRelativeTimeWithHour(order.createdAt)}
                    </span>
                    <span className={`order-status status-${order.orderStatus}`}>
                      {order.orderStatus === 'recibidos' && '📥 Recibidos'}
                      {order.orderStatus === 'proceso' && '🔧 En Proceso'}
                      {order.orderStatus === 'listos' && '✅ Listos'}
                      {order.orderStatus === 'enEntrega' && '🚚 En Entrega'}
                    </span>
                    <div className="empleado-order-services">
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
                <div
                  key={order.id}
                  className={`empleado-order-item assign-order-item ${isDeliveryOverdue(order.deliveryDate) ? 'overdue' : ''}`}
                  onClick={() => onOrderClick && onOrderClick({ ...order, currentStatus: order.orderStatus })}
                  style={{ cursor: 'pointer' }}
                  title="Click para ver detalles de la orden"
                >
                  <div className="empleado-order-info">
                    <span className="empleado-order-number">#{parseInt(order.orderNumber, 10)}</span>
                    {order.priority === 'high' && (
                      <div className="order-priority-badge">Urgente</div>
                    )}
                    <span className="empleado-order-client">{order.client}</span>
                  </div>
                  <div className="empleado-order-details">
                    {order.orderImages && order.orderImages.length > 0 && (
                      <img
                        src={order.orderImages[0]}
                        alt="Orden"
                        className="empleado-order-thumbnail"
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(order.orderImages[0]);
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                    <span className="empleado-order-created-date">
                      <span>Recibido </span>
                      {getRelativeTimeWithHour(order.createdAt)}
                    </span>
                    <div className="empleado-order-services">
                      {getServiceIcons(order.services)}
                    </div>
                    <button
                      className="btn-assign-to-employee"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssignOrder(order);
                      }}
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

      {/* Image Modal */}
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
    </div>
  );
};

export default EmpleadoItem;
