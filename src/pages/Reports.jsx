import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import './Reports.css';

const Reports = () => {
  const [activeFilter, setActiveFilter] = useState('Mes');

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

  return (
    <div className="reports-page">
      {/* Header */}
      <PageHeader
        title="Reportes"
        filters={dateFilters.map((filter) => ({
          label: filter,
          onClick: () => handleFilterChange(filter),
          active: activeFilter === filter
        }))}
      />

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
    </div>
  );
};

export default Reports;
