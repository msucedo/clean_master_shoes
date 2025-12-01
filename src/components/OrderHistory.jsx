import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { subscribeToOrders, subscribeToEmployees } from '../services/firebaseService';
import { useNotification } from '../contexts/NotificationContext';
import OrderHistorySkeleton from './OrderHistorySkeleton';
import './OrderHistory.css';

// Filter Dropdown Component - Extracted outside to prevent re-renders
const FilterDropdown = memo(({
  columnName,
  position = 'left',
  openDropdown,
  filters,
  setFilters,
  setOpenDropdown,
  hasActiveFilter,
  clearColumnFilter,
  toggleCheckbox,
  uniqueServices,
  employees,
  dropdownRef
}) => {
  if (openDropdown !== columnName) return null;

  const renderContent = () => {
    switch (columnName) {
      case 'orderNumber':
        return (
          <div className="oh-dropdown-content">
            <input
              type="text"
              className="oh-dropdown-input"
              placeholder="Buscar # orden..."
              value={filters.orderNumber}
              onChange={(e) => setFilters(prev => ({ ...prev, orderNumber: e.target.value }))}
              autoFocus
            />
          </div>
        );

      case 'photo':
        return (
          <div className="oh-dropdown-content">
            <label className="oh-dropdown-radio">
              <input
                type="radio"
                name="photo"
                value="all"
                checked={filters.photo === 'all'}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, photo: e.target.value }));
                  setOpenDropdown(null);
                }}
              />
              <span>Todas</span>
            </label>
            <label className="oh-dropdown-radio">
              <input
                type="radio"
                name="photo"
                value="with"
                checked={filters.photo === 'with'}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, photo: e.target.value }));
                  setOpenDropdown(null);
                }}
              />
              <span>Con foto</span>
            </label>
            <label className="oh-dropdown-radio">
              <input
                type="radio"
                name="photo"
                value="without"
                checked={filters.photo === 'without'}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, photo: e.target.value }));
                  setOpenDropdown(null);
                }}
              />
              <span>Sin foto</span>
            </label>
          </div>
        );

      case 'client':
        return (
          <div className="oh-dropdown-content">
            <input
              type="text"
              className="oh-dropdown-input"
              placeholder="Buscar cliente..."
              value={filters.client}
              onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
              autoFocus
            />
          </div>
        );

      case 'createdDate':
        return (
          <div className="oh-dropdown-content">
            <label className="oh-dropdown-label">Desde:</label>
            <input
              type="date"
              className="oh-dropdown-input"
              value={filters.createdDateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, createdDateFrom: e.target.value }))}
            />
            <label className="oh-dropdown-label">Hasta:</label>
            <input
              type="date"
              className="oh-dropdown-input"
              value={filters.createdDateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, createdDateTo: e.target.value }))}
            />
          </div>
        );

      case 'deliveryDate':
        return (
          <div className="oh-dropdown-content">
            <label className="oh-dropdown-label">Desde:</label>
            <input
              type="date"
              className="oh-dropdown-input"
              value={filters.deliveryDateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, deliveryDateFrom: e.target.value }))}
            />
            <label className="oh-dropdown-label">Hasta:</label>
            <input
              type="date"
              className="oh-dropdown-input"
              value={filters.deliveryDateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, deliveryDateTo: e.target.value }))}
            />
          </div>
        );

      case 'statusOrder':
        return (
          <div className="oh-dropdown-content oh-dropdown-checkboxes">
            {[
              { value: 'recibidos', label: 'Recibido' },
              { value: 'proceso', label: 'En Proceso' },
              { value: 'listos', label: 'Listo' },
              { value: 'enEntrega', label: 'En Entrega' },
              { value: 'completados', label: 'Completado' },
              { value: 'cancelado', label: 'Cancelado' }
            ].map((status) => (
              <label key={status.value} className="oh-dropdown-checkbox">
                <input
                  type="checkbox"
                  checked={filters.statusOrder.includes(status.value)}
                  onChange={() => toggleCheckbox('statusOrder', status.value)}
                />
                <span>{status.label}</span>
              </label>
            ))}
          </div>
        );

      case 'services':
        return (
          <div className="oh-dropdown-content oh-dropdown-checkboxes">
            {uniqueServices.length > 0 ? (
              uniqueServices.map((service) => (
                <label key={service.name} className="oh-dropdown-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.services.includes(service.name)}
                    onChange={() => toggleCheckbox('services', service.name)}
                  />
                  <span>{service.icon} {service.name}</span>
                </label>
              ))
            ) : (
              <div className="oh-dropdown-empty">No hay servicios</div>
            )}
          </div>
        );

      case 'total':
        return (
          <div className="oh-dropdown-content">
            <label className="oh-dropdown-label">Mínimo:</label>
            <input
              type="number"
              className="oh-dropdown-input"
              placeholder="Ej: 100"
              value={filters.totalMin}
              onChange={(e) => setFilters(prev => ({ ...prev, totalMin: e.target.value }))}
            />
            <label className="oh-dropdown-label">Máximo:</label>
            <input
              type="number"
              className="oh-dropdown-input"
              placeholder="Ej: 1000"
              value={filters.totalMax}
              onChange={(e) => setFilters(prev => ({ ...prev, totalMax: e.target.value }))}
            />
          </div>
        );

      case 'paymentStatus':
        return (
          <div className="oh-dropdown-content oh-dropdown-checkboxes">
            {[
              { value: 'paid', label: 'Pagado' },
              { value: 'partial', label: 'Parcial' },
              { value: 'pending', label: 'Pendiente' },
              { value: 'cancelled', label: 'Cancelado' }
            ].map((status) => (
              <label key={status.value} className="oh-dropdown-checkbox">
                <input
                  type="checkbox"
                  checked={filters.paymentStatus.includes(status.value)}
                  onChange={() => toggleCheckbox('paymentStatus', status.value)}
                />
                <span>{status.label}</span>
              </label>
            ))}
          </div>
        );

      case 'paymentMethod':
        return (
          <div className="oh-dropdown-content oh-dropdown-checkboxes">
            {[
              { value: 'cash', label: 'Efectivo' },
              { value: 'card', label: 'Tarjeta' },
              { value: 'transfer', label: 'Transferencia' },
              { value: 'pending', label: 'Pendiente' }
            ].map((method) => (
              <label key={method.value} className="oh-dropdown-checkbox">
                <input
                  type="checkbox"
                  checked={filters.paymentMethod.includes(method.value)}
                  onChange={() => toggleCheckbox('paymentMethod', method.value)}
                />
                <span>{method.label}</span>
              </label>
            ))}
          </div>
        );

      case 'author':
        return (
          <div className="oh-dropdown-content oh-dropdown-checkboxes">
            <label className="oh-dropdown-checkbox">
              <input
                type="checkbox"
                checked={filters.author.includes('no-author')}
                onChange={() => toggleCheckbox('author', 'no-author')}
              />
              <span>N/A</span>
            </label>
            {employees.map((employee) => (
              <label key={employee.id} className="oh-dropdown-checkbox">
                <input
                  type="checkbox"
                  checked={filters.author.includes(employee.id)}
                  onChange={() => toggleCheckbox('author', employee.id)}
                />
                <span>{employee.emoji ? `${employee.emoji} ` : ''}{employee.name}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={`oh-filter-dropdown ${position === 'right' ? 'oh-filter-dropdown-right' : ''}`}
    >
      {renderContent()}
      {hasActiveFilter(columnName) && (
        <button
          className="oh-dropdown-clear"
          onClick={() => clearColumnFilter(columnName)}
        >
          Limpiar filtro
        </button>
      )}
    </div>
  );
});

FilterDropdown.displayName = 'FilterDropdown';

// Pagination constant
const ITEMS_PER_PAGE = 25;

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
  const [previewImage, setPreviewImage] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    orderNumber: '',
    photo: 'all', // 'all', 'with', 'without'
    client: '',
    createdDateFrom: '',
    createdDateTo: '',
    deliveryDateFrom: '',
    deliveryDateTo: '',
    statusOrder: [], // array of selected statuses
    services: [], // array of selected service names
    totalMin: '',
    totalMax: '',
    paymentStatus: [], // array of selected payment statuses
    paymentMethod: [], // array of selected payment methods
    author: [] // array of selected author IDs
  });

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState(null); // 'orderNumber', 'photo', 'client', etc.
  const dropdownRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // For date dropdowns, allow full freedom for native date picker to work
      const isDateDropdown = openDropdown === 'createdDate' || openDropdown === 'deliveryDate';

      if (isDateDropdown) {
        // Only close if clicking on another filter icon or outside the table
        const clickedOnTable = event.target.closest('.oh-table');
        const clickedOnFilterIcon = event.target.closest('.oh-filter-icon');

        if (!clickedOnTable || clickedOnFilterIcon) {
          setOpenDropdown(null);
        }
        return;
      }

      // For other dropdowns, normal behavior
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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
      pending: 'Pendiente',
      cancelled: 'Cancelado'
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

  // Get unique services from all orders
  const uniqueServices = useMemo(() => {
    const servicesMap = new Map();
    allOrders.forEach(order => {
      if (order.services && order.services.length > 0) {
        order.services.forEach(service => {
          if (service.status !== 'cancelled' && service.serviceName) {
            servicesMap.set(service.serviceName, {
              name: service.serviceName,
              icon: service.icon || '🛠️'
            });
          }
        });
      }
    });
    return Array.from(servicesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allOrders]);

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      orderNumber: '',
      photo: 'all',
      client: '',
      createdDateFrom: '',
      createdDateTo: '',
      deliveryDateFrom: '',
      deliveryDateTo: '',
      statusOrder: [],
      services: [],
      totalMin: '',
      totalMax: '',
      paymentStatus: [],
      paymentMethod: [],
      author: []
    });
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.orderNumber) count++;
    if (filters.photo !== 'all') count++;
    if (filters.client) count++;
    if (filters.createdDateFrom || filters.createdDateTo) count++;
    if (filters.deliveryDateFrom || filters.deliveryDateTo) count++;
    if (filters.statusOrder.length > 0) count++;
    if (filters.services.length > 0) count++;
    if (filters.totalMin || filters.totalMax) count++;
    if (filters.paymentStatus.length > 0) count++;
    if (filters.paymentMethod.length > 0) count++;
    if (filters.author.length > 0) count++;
    return count;
  }, [filters]);

  // Toggle dropdown
  const toggleDropdown = useCallback((columnName) => {
    setOpenDropdown(prev => prev === columnName ? null : columnName);
  }, []);

  // Check if a column has active filter
  const hasActiveFilter = (columnName) => {
    switch (columnName) {
      case 'orderNumber': return !!filters.orderNumber;
      case 'photo': return filters.photo !== 'all';
      case 'client': return !!filters.client;
      case 'createdDate': return !!(filters.createdDateFrom || filters.createdDateTo);
      case 'deliveryDate': return !!(filters.deliveryDateFrom || filters.deliveryDateTo);
      case 'statusOrder': return filters.statusOrder.length > 0;
      case 'services': return filters.services.length > 0;
      case 'total': return !!(filters.totalMin || filters.totalMax);
      case 'paymentStatus': return filters.paymentStatus.length > 0;
      case 'paymentMethod': return filters.paymentMethod.length > 0;
      case 'author': return filters.author.length > 0;
      default: return false;
    }
  };

  // Clear specific filter
  const clearColumnFilter = useCallback((columnName) => {
    setFilters(prev => {
      switch (columnName) {
        case 'orderNumber':
          return { ...prev, orderNumber: '' };
        case 'photo':
          return { ...prev, photo: 'all' };
        case 'client':
          return { ...prev, client: '' };
        case 'createdDate':
          return { ...prev, createdDateFrom: '', createdDateTo: '' };
        case 'deliveryDate':
          return { ...prev, deliveryDateFrom: '', deliveryDateTo: '' };
        case 'statusOrder':
          return { ...prev, statusOrder: [] };
        case 'services':
          return { ...prev, services: [] };
        case 'total':
          return { ...prev, totalMin: '', totalMax: '' };
        case 'paymentStatus':
          return { ...prev, paymentStatus: [] };
        case 'paymentMethod':
          return { ...prev, paymentMethod: [] };
        case 'author':
          return { ...prev, author: [] };
        default:
          return prev;
      }
    });
  }, []);

  // Toggle checkbox in multi-select filters
  const toggleCheckbox = useCallback((filterName, value) => {
    setFilters(prev => {
      const currentValues = prev[filterName];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterName]: newValues };
    });
    // Close dropdown after selection
    setOpenDropdown(null);
  }, []);

  const filteredOrders = useMemo(() => {
    let filtered = allOrders;

    // Apply column filters
    // Order number filter
    if (filters.orderNumber) {
      filtered = filtered.filter(order =>
        order.orderNumber?.toString().includes(filters.orderNumber)
      );
    }

    // Photo filter
    if (filters.photo !== 'all') {
      filtered = filtered.filter(order => {
        const hasPhoto = order.orderImages && order.orderImages.length > 0;
        return filters.photo === 'with' ? hasPhoto : !hasPhoto;
      });
    }

    // Client filter
    if (filters.client) {
      const clientSearch = filters.client.toLowerCase();
      filtered = filtered.filter(order =>
        order.client?.toLowerCase().includes(clientSearch)
      );
    }

    // Created date filter
    if (filters.createdDateFrom) {
      // Parse date string manually to avoid timezone issues
      const [year, month, day] = filters.createdDateFrom.split('-').map(Number);
      const fromDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      filtered = filtered.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate >= fromDate;
      });
    }
    if (filters.createdDateTo) {
      // Parse date string manually to avoid timezone issues
      const [year, month, day] = filters.createdDateTo.split('-').map(Number);
      const toDate = new Date(year, month - 1, day, 23, 59, 59, 999);
      filtered = filtered.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        return orderDate <= toDate;
      });
    }

    // Delivery date filter
    if (filters.deliveryDateFrom) {
      // Parse date string manually to avoid timezone issues
      const [year, month, day] = filters.deliveryDateFrom.split('-').map(Number);
      const fromDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      filtered = filtered.filter(order => {
        if (!order.deliveryDate) return false;
        // Parse order deliveryDate manually if it's in YYYY-MM-DD format
        let orderDate;
        if (typeof order.deliveryDate === 'string' && order.deliveryDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [y, m, d] = order.deliveryDate.split('-').map(Number);
          orderDate = new Date(y, m - 1, d, 0, 0, 0, 0);
        } else {
          orderDate = new Date(order.deliveryDate);
          orderDate.setHours(0, 0, 0, 0);
        }
        return orderDate >= fromDate;
      });
    }
    if (filters.deliveryDateTo) {
      // Parse date string manually to avoid timezone issues
      const [year, month, day] = filters.deliveryDateTo.split('-').map(Number);
      const toDate = new Date(year, month - 1, day, 23, 59, 59, 999);
      filtered = filtered.filter(order => {
        if (!order.deliveryDate) return false;
        // Parse order deliveryDate manually if it's in YYYY-MM-DD format
        let orderDate;
        if (typeof order.deliveryDate === 'string' && order.deliveryDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [y, m, d] = order.deliveryDate.split('-').map(Number);
          orderDate = new Date(y, m - 1, d, 23, 59, 59, 999);
        } else {
          orderDate = new Date(order.deliveryDate);
        }
        return orderDate <= toDate;
      });
    }

    // Status order filter
    if (filters.statusOrder.length > 0) {
      filtered = filtered.filter(order =>
        filters.statusOrder.includes(order.statusCategory)
      );
    }

    // Services filter
    if (filters.services.length > 0) {
      filtered = filtered.filter(order => {
        if (!order.services || order.services.length === 0) return false;
        const orderServiceNames = order.services
          .filter(s => s.status !== 'cancelled')
          .map(s => s.serviceName);
        return filters.services.some(serviceName =>
          orderServiceNames.includes(serviceName)
        );
      });
    }

    // Total price filter
    if (filters.totalMin) {
      const min = parseFloat(filters.totalMin);
      filtered = filtered.filter(order =>
        (parseFloat(order.totalPrice) || 0) >= min
      );
    }
    if (filters.totalMax) {
      const max = parseFloat(filters.totalMax);
      filtered = filtered.filter(order =>
        (parseFloat(order.totalPrice) || 0) <= max
      );
    }

    // Payment status filter
    if (filters.paymentStatus.length > 0) {
      filtered = filtered.filter(order =>
        filters.paymentStatus.includes(order.paymentStatus)
      );
    }

    // Payment method filter
    if (filters.paymentMethod.length > 0) {
      filtered = filtered.filter(order =>
        filters.paymentMethod.includes(order.paymentMethod)
      );
    }

    // Author filter
    if (filters.author.length > 0) {
      filtered = filtered.filter(order => {
        const authorId = order.authorId || null;
        const authorName = order.author || null;

        if (!authorId && !authorName) {
          // Include orders with no author if "N/A" is selected
          return filters.author.includes('no-author');
        }

        // Check if author ID or name matches
        return filters.author.includes(authorId) ||
               filters.author.some(id => {
                 const emp = employees.find(e => e.id === id);
                 return emp?.name === authorName;
               });
      });
    }

    return filtered;
  }, [allOrders, filters, employees]);

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage]);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

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
      {/* Filter Controls */}
      <div className="oh-filter-controls-bar">
        <div className="oh-left-controls">
          <div className="oh-results-count">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'orden' : 'órdenes'}
          </div>
          {activeFiltersCount > 0 && (
            <button
              className="oh-clear-filters-btn"
              onClick={handleClearFilters}
              title="Limpiar todos los filtros"
            >
              Limpiar Filtros ({activeFiltersCount})
            </button>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="oh-pagination-controls">
            <button
              className="oh-pagination-btn"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              title="Página anterior"
            >
              ←
            </button>
            <span className="oh-pagination-info">
              Página {currentPage} de {totalPages}
            </span>
            <button
              className="oh-pagination-btn"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              title="Página siguiente"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="oh-table-wrapper">
        <table className="oh-table">
          <thead>
            <tr>
              {/* Order Number */}
              <th className="oh-header-with-filter">
                <div className="oh-header-content">
                  <span># Orden</span>
                  <button
                    className={`oh-filter-icon ${hasActiveFilter('orderNumber') ? 'active' : ''}`}
                    onClick={() => toggleDropdown('orderNumber')}
                  >
                    ▼
                  </button>
                </div>
                <FilterDropdown
                  columnName="orderNumber"
                  position="left"
                  openDropdown={openDropdown}
                  filters={filters}
                  setFilters={setFilters}
                  setOpenDropdown={setOpenDropdown}
                  hasActiveFilter={hasActiveFilter}
                  clearColumnFilter={clearColumnFilter}
                  toggleCheckbox={toggleCheckbox}
                  uniqueServices={uniqueServices}
                  employees={employees}
                  dropdownRef={dropdownRef}
                />
              </th>

              {/* Photo */}
              <th className="oh-header-with-filter">
                <div className="oh-header-content">
                  <span>Foto</span>
                  <button
                    className={`oh-filter-icon ${hasActiveFilter('photo') ? 'active' : ''}`}
                    onClick={() => toggleDropdown('photo')}
                  >
                    ▼
                  </button>
                </div>
                <FilterDropdown
                  columnName="photo"
                  position="left"
                  openDropdown={openDropdown}
                  filters={filters}
                  setFilters={setFilters}
                  setOpenDropdown={setOpenDropdown}
                  hasActiveFilter={hasActiveFilter}
                  clearColumnFilter={clearColumnFilter}
                  toggleCheckbox={toggleCheckbox}
                  uniqueServices={uniqueServices}
                  employees={employees}
                  dropdownRef={dropdownRef}
                />
              </th>

              {/* Cliente */}
              <th className="oh-header-with-filter">
                <div className="oh-header-content">
                  <span>Cliente</span>
                  <button
                    className={`oh-filter-icon ${hasActiveFilter('client') ? 'active' : ''}`}
                    onClick={() => toggleDropdown('client')}
                  >
                    ▼
                  </button>
                </div>
                <FilterDropdown
                  columnName="client"
                  position="left"
                  openDropdown={openDropdown}
                  filters={filters}
                  setFilters={setFilters}
                  setOpenDropdown={setOpenDropdown}
                  hasActiveFilter={hasActiveFilter}
                  clearColumnFilter={clearColumnFilter}
                  toggleCheckbox={toggleCheckbox}
                  uniqueServices={uniqueServices}
                  employees={employees}
                  dropdownRef={dropdownRef}
                />
              </th>

              {/* Fecha Creación */}
              <th className="oh-header-with-filter">
                <div className="oh-header-content">
                  <span>Fecha Creación</span>
                  <button
                    className={`oh-filter-icon ${hasActiveFilter('createdDate') ? 'active' : ''}`}
                    onClick={() => toggleDropdown('createdDate')}
                  >
                    ▼
                  </button>
                </div>
                <FilterDropdown
                  columnName="createdDate"
                  position="left"
                  openDropdown={openDropdown}
                  filters={filters}
                  setFilters={setFilters}
                  setOpenDropdown={setOpenDropdown}
                  hasActiveFilter={hasActiveFilter}
                  clearColumnFilter={clearColumnFilter}
                  toggleCheckbox={toggleCheckbox}
                  uniqueServices={uniqueServices}
                  employees={employees}
                  dropdownRef={dropdownRef}
                />
              </th>

              {/* Fecha Entrega */}
              <th className="oh-header-with-filter">
                <div className="oh-header-content">
                  <span>Fecha Entrega</span>
                  <button
                    className={`oh-filter-icon ${hasActiveFilter('deliveryDate') ? 'active' : ''}`}
                    onClick={() => toggleDropdown('deliveryDate')}
                  >
                    ▼
                  </button>
                </div>
                <FilterDropdown
                  columnName="deliveryDate"
                  position="left"
                  openDropdown={openDropdown}
                  filters={filters}
                  setFilters={setFilters}
                  setOpenDropdown={setOpenDropdown}
                  hasActiveFilter={hasActiveFilter}
                  clearColumnFilter={clearColumnFilter}
                  toggleCheckbox={toggleCheckbox}
                  uniqueServices={uniqueServices}
                  employees={employees}
                  dropdownRef={dropdownRef}
                />
              </th>

              {/* Estado Orden */}
              <th className="oh-header-with-filter">
                <div className="oh-header-content">
                  <span>Estado Orden</span>
                  <button
                    className={`oh-filter-icon ${hasActiveFilter('statusOrder') ? 'active' : ''}`}
                    onClick={() => toggleDropdown('statusOrder')}
                  >
                    ▼
                  </button>
                </div>
                <FilterDropdown
                  columnName="statusOrder"
                  position="left"
                  openDropdown={openDropdown}
                  filters={filters}
                  setFilters={setFilters}
                  setOpenDropdown={setOpenDropdown}
                  hasActiveFilter={hasActiveFilter}
                  clearColumnFilter={clearColumnFilter}
                  toggleCheckbox={toggleCheckbox}
                  uniqueServices={uniqueServices}
                  employees={employees}
                  dropdownRef={dropdownRef}
                />
              </th>

              {/* Servicios */}
              <th className="oh-header-with-filter">
                <div className="oh-header-content">
                  <span>Servicios</span>
                  <button
                    className={`oh-filter-icon ${hasActiveFilter('services') ? 'active' : ''}`}
                    onClick={() => toggleDropdown('services')}
                  >
                    ▼
                  </button>
                </div>
                <FilterDropdown
                  columnName="services"
                  position="left"
                  openDropdown={openDropdown}
                  filters={filters}
                  setFilters={setFilters}
                  setOpenDropdown={setOpenDropdown}
                  hasActiveFilter={hasActiveFilter}
                  clearColumnFilter={clearColumnFilter}
                  toggleCheckbox={toggleCheckbox}
                  uniqueServices={uniqueServices}
                  employees={employees}
                  dropdownRef={dropdownRef}
                />
              </th>

              {/* Total */}
              <th className="oh-header-with-filter">
                <div className="oh-header-content">
                  <span>Total</span>
                  <button
                    className={`oh-filter-icon ${hasActiveFilter('total') ? 'active' : ''}`}
                    onClick={() => toggleDropdown('total')}
                  >
                    ▼
                  </button>
                </div>
                <FilterDropdown
                  columnName="total"
                  position="right"
                  openDropdown={openDropdown}
                  filters={filters}
                  setFilters={setFilters}
                  setOpenDropdown={setOpenDropdown}
                  hasActiveFilter={hasActiveFilter}
                  clearColumnFilter={clearColumnFilter}
                  toggleCheckbox={toggleCheckbox}
                  uniqueServices={uniqueServices}
                  employees={employees}
                  dropdownRef={dropdownRef}
                />
              </th>

              {/* Estado Pago */}
              <th className="oh-header-with-filter">
                <div className="oh-header-content">
                  <span>Estado Pago</span>
                  <button
                    className={`oh-filter-icon ${hasActiveFilter('paymentStatus') ? 'active' : ''}`}
                    onClick={() => toggleDropdown('paymentStatus')}
                  >
                    ▼
                  </button>
                </div>
                <FilterDropdown
                  columnName="paymentStatus"
                  position="right"
                  openDropdown={openDropdown}
                  filters={filters}
                  setFilters={setFilters}
                  setOpenDropdown={setOpenDropdown}
                  hasActiveFilter={hasActiveFilter}
                  clearColumnFilter={clearColumnFilter}
                  toggleCheckbox={toggleCheckbox}
                  uniqueServices={uniqueServices}
                  employees={employees}
                  dropdownRef={dropdownRef}
                />
              </th>

              {/* Método de Pago */}
              <th className="oh-header-with-filter">
                <div className="oh-header-content">
                  <span>Método de Pago</span>
                  <button
                    className={`oh-filter-icon ${hasActiveFilter('paymentMethod') ? 'active' : ''}`}
                    onClick={() => toggleDropdown('paymentMethod')}
                  >
                    ▼
                  </button>
                </div>
                <FilterDropdown
                  columnName="paymentMethod"
                  position="right"
                  openDropdown={openDropdown}
                  filters={filters}
                  setFilters={setFilters}
                  setOpenDropdown={setOpenDropdown}
                  hasActiveFilter={hasActiveFilter}
                  clearColumnFilter={clearColumnFilter}
                  toggleCheckbox={toggleCheckbox}
                  uniqueServices={uniqueServices}
                  employees={employees}
                  dropdownRef={dropdownRef}
                />
              </th>

              {/* Autor */}
              <th className="oh-header-with-filter">
                <div className="oh-header-content">
                  <span>Autor</span>
                  <button
                    className={`oh-filter-icon ${hasActiveFilter('author') ? 'active' : ''}`}
                    onClick={() => toggleDropdown('author')}
                  >
                    ▼
                  </button>
                </div>
                <FilterDropdown
                  columnName="author"
                  position="right"
                  openDropdown={openDropdown}
                  filters={filters}
                  setFilters={setFilters}
                  setOpenDropdown={setOpenDropdown}
                  hasActiveFilter={hasActiveFilter}
                  clearColumnFilter={clearColumnFilter}
                  toggleCheckbox={toggleCheckbox}
                  uniqueServices={uniqueServices}
                  employees={employees}
                  dropdownRef={dropdownRef}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order) => {
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
