import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { subscribeToOrders, subscribeToEmployees } from '../services/firebaseService';
import { useNotification } from '../contexts/NotificationContext';
import OrderHistorySkeleton from './OrderHistorySkeleton';
import './OrderHistory.css';

const OrderHistory = () => {
  const { showError } = useNotification();
  const [orders, setOrders] = useState({
    recibidos: [],
    proceso: [],
    listos: [],
    enEntrega: [],
    completados: [],
    cancelado: []
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  // Subscribe to orders
  useEffect(() => {
    const unsubscribe = subscribeToOrders((ordersData) => {
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to employees
  useEffect(() => {
    const unsubscribe = subscribeToEmployees((employeesData) => {
      setEmployees(employeesData);
    });

    return () => unsubscribe();
  }, []);

  // Combine all orders from all statuses
  const allOrders = useMemo(() => {
    const combined = [
      ...orders.recibidos.map(o => ({ ...o, statusCategory: 'recibidos' })),
      ...orders.proceso.map(o => ({ ...o, statusCategory: 'proceso' })),
      ...orders.listos.map(o => ({ ...o, statusCategory: 'listos' })),
      ...orders.enEntrega.map(o => ({ ...o, statusCategory: 'enEntrega' })),
      ...orders.completados.map(o => ({ ...o, statusCategory: 'completados' })),
      ...orders.cancelado.map(o => ({ ...o, statusCategory: 'cancelado' }))
    ];

    // Sort by order number descending (newest first)
    return combined.sort((a, b) => {
      const numA = parseInt(a.orderNumber) || 0;
      const numB = parseInt(b.orderNumber) || 0;
      return numB - numA;
    });
  }, [orders]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    let date;

    // Si es formato YYYY-MM-DD (sin hora)
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      date = new Date(year, month - 1, day);
    } else {
      // Si es timestamp de Firebase o ISO string
      date = new Date(dateString);
    }

    // Validar fecha
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getStatusLabel = (statusCategory) => {
    const labels = {
      recibidos: 'Recibido',
      proceso: 'En Proceso',
      listos: 'Listo',
      enEntrega: 'En Entrega',
      completados: 'Completado',
      cancelado: 'Cancelado'
    };
    return labels[statusCategory] || statusCategory;
  };

  const getPaymentStatusLabel = (paymentStatus) => {
    const labels = {
      paid: 'Pagado',
      partial: 'Parcial',
      pending: 'Pendiente'
    };
    return labels[paymentStatus] || paymentStatus;
  };

  const getPaymentMethodLabel = (paymentMethod) => {
    const labels = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
      pending: 'Pendiente'
    };
    return labels[paymentMethod] || paymentMethod;
  };

  const getAuthorInfo = (order) => {
    const authorId = order.authorId || null;
    const authorName = order.author || null;

    if (!authorId && !authorName) return { name: 'N/A', emoji: null };

    const author = authorId
      ? employees.find(emp => emp.id === authorId)
      : employees.find(emp => emp.name === authorName);

    return {
      name: author?.name || authorName || 'N/A',
      emoji: author?.emoji || null
    };
  };

  const getServiceIcons = (order) => {
    if (!order.services || order.services.length === 0) return [];

    const activeServices = order.services.filter(service => service.status !== 'cancelled');
    const grouped = {};

    activeServices.forEach(service => {
      const emoji = service.icon || '🛠️';
      if (!grouped[emoji]) {
        grouped[emoji] = { emoji, count: 0 };
      }
      grouped[emoji].count++;
    });

    return Object.values(grouped);
  };

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return allOrders;

    const search = searchTerm.toLowerCase();
    return allOrders.filter(order => {
      const orderNumber = order.orderNumber?.toString().toLowerCase() || '';
      const client = order.client?.toLowerCase() || '';
      const createdDate = formatDate(order.createdAt).toLowerCase();
      const deliveryDate = formatDate(order.deliveryDate).toLowerCase();
      const status = getStatusLabel(order.statusCategory).toLowerCase();
      const paymentStatus = getPaymentStatusLabel(order.paymentStatus).toLowerCase();
      const paymentMethod = getPaymentMethodLabel(order.paymentMethod).toLowerCase();
      const author = getAuthorInfo(order).name.toLowerCase();

      return (
        orderNumber.includes(search) ||
        client.includes(search) ||
        createdDate.includes(search) ||
        deliveryDate.includes(search) ||
        status.includes(search) ||
        paymentStatus.includes(search) ||
        paymentMethod.includes(search) ||
        author.includes(search)
      );
    });
  }, [allOrders, searchTerm]);

  const handleImageClick = (imageUrl) => {
    setPreviewImage(imageUrl);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  if (loading) {
    return <OrderHistorySkeleton />;
  }

  if (allOrders.length === 0) {
    return (
      <div className="oh-empty">
        <div className="oh-empty-icon">📦</div>
        <h3 className="oh-empty-title">No hay órdenes registradas</h3>
        <p className="oh-empty-text">Las órdenes creadas aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="order-history">
      {/* Search Bar */}
      <div className="oh-search-bar">
        <input
          type="text"
          className="oh-search-input"
          placeholder="Buscar por # orden, cliente, fecha, estado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="oh-results-count">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'orden' : 'órdenes'}
        </div>
      </div>

      {/* Table */}
      <div className="oh-table-wrapper">
        <table className="oh-table">
          <thead>
            <tr>
              <th># Orden</th>
              <th>Foto</th>
              <th>Cliente</th>
              <th>Fecha Creación</th>
              <th>Fecha Entrega</th>
              <th>Estado Orden</th>
              <th>Servicios</th>
              <th>Total</th>
              <th>Estado Pago</th>
              <th>Método de Pago</th>
              <th>Autor</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const authorInfo = getAuthorInfo(order);
              const serviceIcons = getServiceIcons(order);
              const firstImage = order.orderImages && order.orderImages.length > 0
                ? order.orderImages[0]
                : null;

              return (
                <tr key={order.id} className="oh-row">
                  <td className="oh-order-number">#{parseInt(order.orderNumber, 10)}</td>

                  <td className="oh-photo">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt="Orden"
                        className="oh-photo-thumbnail"
                        onClick={() => handleImageClick(firstImage)}
                      />
                    ) : (
                      <div className="oh-photo-placeholder">📷</div>
                    )}
                  </td>

                  <td className="oh-client">{order.client || 'Sin nombre'}</td>

                  <td className="oh-created-date">{formatDate(order.createdAt)}</td>

                  <td className="oh-delivery-date">{formatDate(order.deliveryDate)}</td>

                  <td className="oh-status-order">
                    <span className={`oh-status-badge ${order.statusCategory}`}>
                      {getStatusLabel(order.statusCategory)}
                    </span>
                  </td>

                  <td className="oh-services">
                    <div className="oh-services-icons">
                      {serviceIcons.length > 0 ? (
                        serviceIcons.map((service, idx) => (
                          <div key={idx} className="oh-service-icon">
                            {service.emoji}
                            {service.count > 1 && (
                              <span className="oh-service-count">×{service.count}</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="oh-no-services">Sin servicios</span>
                      )}
                    </div>
                  </td>

                  <td className="oh-total">{formatCurrency(order.totalPrice || 0)}</td>

                  <td className="oh-payment-status">
                    <span className={`oh-payment-badge ${order.paymentStatus}`}>
                      {getPaymentStatusLabel(order.paymentStatus)}
                    </span>
                  </td>

                  <td className="oh-payment-method">
                    <span className={`oh-method-badge ${order.paymentMethod}`}>
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </span>
                  </td>

                  <td className="oh-author">
                    {authorInfo.emoji && (
                      <span className="oh-author-emoji">{authorInfo.emoji}</span>
                    )}
                    <span className="oh-author-name">{authorInfo.name}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && searchTerm && (
        <div className="oh-no-results">
          <div className="oh-no-results-icon">🔍</div>
          <div className="oh-no-results-text">
            No se encontraron órdenes que coincidan con "{searchTerm}"
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="oh-preview-modal" onClick={closePreview}>
          <div className="oh-preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="oh-preview-close" onClick={closePreview}>✕</button>
            <img src={previewImage} alt="Preview" className="oh-preview-image" />
          </div>
        </div>
      )}
    </div>
  );
};

OrderHistory.propTypes = {};

export default OrderHistory;
