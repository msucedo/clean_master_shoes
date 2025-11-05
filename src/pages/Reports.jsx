import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import CashRegister from '../components/CashRegister';
import CashClosureHistory from '../components/CashClosureHistory';
import CashClosureDetail from '../components/CashClosureDetail';
import Modal from '../components/Modal';
import RevenueChart from '../components/RevenueChart';
import ServicesChart from '../components/ServicesChart';
import { subscribeToOrders } from '../services/firebaseService';
import './Reports.css';

const Reports = () => {
  const [activeFilter, setActiveFilter] = useState('Hoy');
  const [activeTab, setActiveTab] = useState('corte');
  const [selectedClosure, setSelectedClosure] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [orders, setOrders] = useState({
    recibidos: [],
    proceso: [],
    listos: [],
    enEntrega: [],
    completados: [],
    cancelado: []
  });

  // Subscribe to orders for cash register
  useEffect(() => {
    const unsubscribe = subscribeToOrders((ordersData) => {
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  const dateFilters = ['Hoy', 'Semana', 'Mes', 'Año'];

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  // Get filtered orders for cash register based on date filter
  const getFilteredOrders = () => {
    const now = new Date();
    let startDate, endDate;

    switch (activeFilter) {
      case 'Hoy':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'Semana':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startDate = new Date(startOfWeek.setHours(0, 0, 0, 0));
        endDate = new Date();
        break;
      case 'Mes':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'Año':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
    }

    // Combine all orders from all statuses
    const allOrders = [
      ...orders.recibidos,
      ...orders.proceso,
      ...orders.listos,
      ...orders.enEntrega,
      ...orders.completados
    ];

    // Filter by date range (using completion date for cash register)
    return allOrders.filter(order => {
      if (!order.completedDate) return false;
      const orderDate = new Date(order.completedDate);
      return orderDate >= startDate && orderDate <= endDate;
    });
  };

  const filteredOrders = getFilteredOrders();

  // Calculate statistics based on filtered orders
  const calculateStats = () => {
    let totalRevenue = 0;
    let completedOrders = 0;
    let pendingAmount = 0;

    filteredOrders.forEach(order => {
      const total = parseFloat(order.totalPrice) || 0;
      const advance = parseFloat(order.advancePayment) || 0;

      if (order.paymentStatus === 'paid') {
        totalRevenue += total;
        completedOrders++;
      } else if (order.paymentStatus === 'partial') {
        totalRevenue += advance;
        pendingAmount += (total - advance);
      } else if (order.paymentStatus === 'pending') {
        pendingAmount += total;
      }
    });

    const averageTicket = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    return {
      totalRevenue,
      completedOrders,
      averageTicket,
      pendingAmount
    };
  };

  // Calculate top 5 clients based on filtered orders
  const calculateTopClients = () => {
    const clientData = {};

    filteredOrders.forEach(order => {
      const clientName = order.client || 'Sin nombre';
      const total = parseFloat(order.totalPrice) || 0;
      const advance = parseFloat(order.advancePayment) || 0;

      let revenue = 0;
      if (order.paymentStatus === 'paid') {
        revenue = total;
      } else if (order.paymentStatus === 'partial') {
        revenue = advance;
      }

      if (!clientData[clientName]) {
        clientData[clientName] = {
          orders: 0,
          revenue: 0
        };
      }

      clientData[clientName].orders += 1;
      clientData[clientName].revenue += revenue;
    });

    // Sort by revenue and get top 5
    return Object.entries(clientData)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([name, data], index) => ({
        rank: index + 1,
        name,
        detail: `${data.orders} ${data.orders === 1 ? 'orden' : 'órdenes'}`,
        value: data.revenue,
        gold: index < 3
      }));
  };

  // Calculate top services based on filtered orders
  const calculateTopServices = () => {
    const serviceData = {};

    filteredOrders.forEach(order => {
      if (!order.services || order.services.length === 0) return;

      order.services.forEach(service => {
        const serviceName = service.serviceName || 'Sin nombre';
        const servicePrice = parseFloat(service.price) || 0;

        if (!serviceData[serviceName]) {
          serviceData[serviceName] = {
            count: 0,
            revenue: 0
          };
        }

        serviceData[serviceName].count += 1;
        serviceData[serviceName].revenue += servicePrice;
      });
    });

    // Sort by revenue and get top services
    return Object.entries(serviceData)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 4)
      .map(([name, data], index) => ({
        rank: index + 1,
        name,
        detail: `${data.count} ${data.count === 1 ? 'orden' : 'órdenes'}`,
        value: data.revenue,
        gold: index < 3
      }));
  };

  const stats = calculateStats();
  const topClients = calculateTopClients();
  const topServices = calculateTopServices();

  // Format stats for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const statsCards = [
    {
      type: 'revenue',
      icon: '💰',
      label: `Ingresos ${activeFilter === 'Hoy' ? 'del Día' : activeFilter === 'Semana' ? 'de la Semana' : activeFilter === 'Mes' ? 'del Mes' : 'del Año'}`,
      value: formatCurrency(stats.totalRevenue),
      change: `${stats.completedOrders} ${stats.completedOrders === 1 ? 'orden' : 'órdenes'}`,
      changeType: 'positive'
    },
    {
      type: 'orders',
      icon: '📦',
      label: 'Órdenes Completadas',
      value: stats.completedOrders.toString(),
      change: `${formatCurrency(stats.totalRevenue)} en ventas`,
      changeType: 'positive'
    },
    {
      type: 'average',
      icon: '💳',
      label: 'Ticket Promedio',
      value: formatCurrency(stats.averageTicket),
      change: `${stats.completedOrders} ${stats.completedOrders === 1 ? 'orden' : 'órdenes'}`,
      changeType: 'positive'
    },
    {
      type: 'pending',
      icon: '⚠️',
      label: 'Por Cobrar',
      value: formatCurrency(stats.pendingAmount),
      change: filteredOrders.filter(o => o.paymentStatus === 'pending' || o.paymentStatus === 'partial').length + ' órdenes',
      changeType: 'negative'
    }
  ];

  const handleViewClosureDetails = (closure) => {
    setSelectedClosure(closure);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedClosure(null);
  };

  return (
    <div className="reports-page">
      {/* Header */}
      <PageHeader
        title="Reportes y Corte de Caja"
        filters={dateFilters.map((filter) => ({
          label: filter,
          onClick: () => handleFilterChange(filter),
          active: activeFilter === filter
        }))}
      />

      {/* Tabs */}
      <div className="reports-tabs">
        {/* Select para móvil (oculto en desktop por CSS) */}
        <select
          className="reports-tab-select-mobile"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
        >
          <option value="reportes">📊 Reportes</option>
          <option value="corte">💰 Corte de Caja</option>
          <option value="historial">📋 Historial de Cortes</option>
        </select>

        {/* Botones para desktop/tablet (ocultos en móvil por CSS) */}
        <button
          className={`reports-tab ${activeTab === 'reportes' ? 'active' : ''}`}
          onClick={() => setActiveTab('reportes')}
        >
          📊 Reportes
        </button>
        <button
          className={`reports-tab ${activeTab === 'corte' ? 'active' : ''}`}
          onClick={() => setActiveTab('corte')}
        >
          💰 Corte de Caja
        </button>
        <button
          className={`reports-tab ${activeTab === 'historial' ? 'active' : ''}`}
          onClick={() => setActiveTab('historial')}
        >
          📋 Historial de Cortes
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'reportes' && (
        <div className="reports-content">
          {/* Stats Grid */}
          <div className="stats-grid">
        {statsCards.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.type}`}>
            <div className="stat-header">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-info">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
            </div>
            <div className={`stat-change ${stat.changeType}`}>{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Revenue Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Ingresos {activeFilter === 'Hoy' ? 'del Día' : activeFilter === 'Semana' ? 'de la Semana' : activeFilter === 'Mes' ? 'del Mes' : 'del Año'}</div>
              <div className="chart-subtitle">{filteredOrders.length} {filteredOrders.length === 1 ? 'orden' : 'órdenes'}</div>
            </div>
          </div>
          <div style={{ height: '300px', padding: '20px' }}>
            <RevenueChart orders={filteredOrders} dateFilter={activeFilter} />
          </div>
        </div>

        {/* Services Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Servicios Más Populares</div>
              <div className="chart-subtitle">{activeFilter}</div>
            </div>
          </div>
          <div style={{ height: '300px', padding: '20px' }}>
            <ServicesChart orders={filteredOrders} />
          </div>
        </div>
      </div>

      {/* Top Lists */}
      <div className="lists-grid">
        {/* Top Clientes */}
        <div className="list-card">
          <div className="list-header">🏆 Top 5 Clientes</div>
          {topClients.length > 0 ? (
            topClients.map((client) => (
              <div key={client.rank} className="list-item">
                <div className={`list-rank ${client.gold ? 'gold' : ''}`}>{client.rank}</div>
                <div className="list-info">
                  <div className="list-name">{client.name}</div>
                  <div className="list-detail">{client.detail}</div>
                </div>
                <div className="list-value">{formatCurrency(client.value)}</div>
              </div>
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No hay datos para mostrar
            </div>
          )}
        </div>

        {/* Top Servicios */}
        <div className="list-card">
          <div className="list-header">🔥 Servicios Más Vendidos</div>
          {topServices.length > 0 ? (
            topServices.map((service) => (
              <div key={service.rank} className="list-item">
                <div className={`list-rank ${service.gold ? 'gold' : ''}`}>{service.rank}</div>
                <div className="list-info">
                  <div className="list-name">{service.name}</div>
                  <div className="list-detail">{service.detail}</div>
                </div>
                <div className="list-value">{formatCurrency(service.value)}</div>
              </div>
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No hay datos para mostrar
            </div>
          )}
        </div>
      </div>
        </div>
      )}

      {/* Cash Register Tab */}
      {activeTab === 'corte' && (
        <CashRegister
          orders={filteredOrders}
          dateFilter={activeFilter}
        />
      )}

      {/* History Tab */}
      {activeTab === 'historial' && (
        <CashClosureHistory
          onViewDetails={handleViewClosureDetails}
        />
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedClosure && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          title=""
          size="large"
        >
          <CashClosureDetail
            closure={selectedClosure}
            onClose={handleCloseDetailModal}
          />
        </Modal>
      )}
    </div>
  );
};

export default Reports;
