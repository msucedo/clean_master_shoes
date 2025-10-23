import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import CashRegister from '../components/CashRegister';
import { subscribeToOrders } from '../services/firebaseService';
import './Reports.css';

const Reports = () => {
  const [activeFilter, setActiveFilter] = useState('Mes');
  const [activeTab, setActiveTab] = useState('reportes');
  const [orders, setOrders] = useState({
    recibidos: [],
    proceso: [],
    listos: [],
    enEntrega: [],
    completados: [],
    cancelados: []
  });

  // Subscribe to orders for cash register
  useEffect(() => {
    const unsubscribe = subscribeToOrders((ordersData) => {
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  const stats = [
    {
      type: 'revenue',
      icon: '💰',
      label: 'Ingresos del Mes',
      value: '$8,450',
      change: '↑ 23% vs mes pasado',
      changeType: 'positive'
    },
    {
      type: 'orders',
      icon: '📦',
      label: 'Órdenes Completadas',
      value: '47',
      change: '↑ 12% vs mes pasado',
      changeType: 'positive'
    },
    {
      type: 'average',
      icon: '💳',
      label: 'Ticket Promedio',
      value: '$180',
      change: '↑ 8% vs mes pasado',
      changeType: 'positive'
    },
    {
      type: 'pending',
      icon: '⚠️',
      label: 'Por Cobrar',
      value: '$950',
      change: '2 clientes',
      changeType: 'negative'
    }
  ];

  const topClients = [
    { rank: 1, name: 'Isabel Ramos', detail: '22 órdenes este mes', value: '$5,200', gold: true },
    { rank: 2, name: 'Jorge Hernández', detail: '24 órdenes totales', value: '$4,800', gold: true },
    { rank: 3, name: 'Ana Martínez', detail: '18 órdenes totales', value: '$3,200', gold: true },
    { rank: 4, name: 'Patricia Sánchez', detail: '12 órdenes totales', value: '$2,100', gold: false },
    { rank: 5, name: 'Juan Pérez', detail: '8 órdenes totales', value: '$1,600', gold: false }
  ];

  const topServices = [
    { rank: 1, name: 'Lavado Básico', detail: '47 órdenes este mes', value: '$7,050', gold: true },
    { rank: 2, name: 'Lavado Profundo', detail: '32 órdenes este mes', value: '$8,000', gold: true },
    { rank: 3, name: 'Lavado Express', detail: '24 órdenes este mes', value: '$2,400', gold: true },
    { rank: 4, name: 'Restauración', detail: '12 órdenes este mes', value: '$4,800', gold: false }
  ];

  const dateFilters = ['Hoy', 'Semana', 'Mes', 'Año'];

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    // TODO: Load data for the selected period
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

    // Filter by date range
    return allOrders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  };

  const filteredOrders = getFilteredOrders();

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
      </div>

      {/* Tab Content */}
      {activeTab === 'reportes' && (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
        {stats.map((stat, index) => (
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
              <div className="chart-title">Ingresos del Mes</div>
              <div className="chart-subtitle">Octubre 2025</div>
            </div>
          </div>
          <div className="chart-placeholder">📈</div>
        </div>

        {/* Services Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Servicios Más Populares</div>
              <div className="chart-subtitle">Últimos 30 días</div>
            </div>
          </div>
          <div className="chart-placeholder">📊</div>
        </div>
      </div>

      {/* Top Lists */}
      <div className="lists-grid">
        {/* Top Clientes */}
        <div className="list-card">
          <div className="list-header">🏆 Top 5 Clientes</div>
          {topClients.map((client) => (
            <div key={client.rank} className="list-item">
              <div className={`list-rank ${client.gold ? 'gold' : ''}`}>{client.rank}</div>
              <div className="list-info">
                <div className="list-name">{client.name}</div>
                <div className="list-detail">{client.detail}</div>
              </div>
              <div className="list-value">{client.value}</div>
            </div>
          ))}
        </div>

        {/* Top Servicios */}
        <div className="list-card">
          <div className="list-header">🔥 Servicios Más Vendidos</div>
          {topServices.map((service) => (
            <div key={service.rank} className="list-item">
              <div className={`list-rank ${service.gold ? 'gold' : ''}`}>{service.rank}</div>
              <div className="list-info">
                <div className="list-name">{service.name}</div>
                <div className="list-detail">{service.detail}</div>
              </div>
              <div className="list-value">{service.value}</div>
            </div>
          ))}
        </div>
      </div>
        </>
      )}

      {/* Cash Register Tab */}
      {activeTab === 'corte' && (
        <CashRegister
          orders={filteredOrders}
          dateFilter={activeFilter}
        />
      )}
    </div>
  );
};

export default Reports;
