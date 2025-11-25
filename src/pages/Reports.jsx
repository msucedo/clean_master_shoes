import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import CashRegister from '../components/CashRegister';
import CashClosureHistory from '../components/CashClosureHistory';
import CashClosureDetail from '../components/CashClosureDetail';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import DataSourceToggle from '../components/DataSourceToggle';
import RevenueChart from '../components/RevenueChart';
import ServicesChart from '../components/ServicesChart';
import PaymentMethodsChart from '../components/PaymentMethodsChart';
import ExpensesByCategoryChart from '../components/ExpensesByCategoryChart';
import ProfitTrendChart from '../components/ProfitTrendChart';
import PeriodComparisonChart from '../components/PeriodComparisonChart';
import { subscribeToOrders, subscribeToExpenses, subscribeToCashRegisterClosures } from '../services/firebaseService';
import './Reports.css';

const Reports = () => {
  const [activeFilter, setActiveFilter] = useState('Hoy');
  const [activeTab, setActiveTab] = useState('corte');
  const [dataSource, setDataSource] = useState('cortes'); // 'cortes' or 'ordenes'
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
  const [expenses, setExpenses] = useState([]);
  const [closures, setClosures] = useState([]);

  // Subscribe to orders for cash register
  useEffect(() => {
    const unsubscribe = subscribeToOrders((ordersData) => {
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to expenses
  useEffect(() => {
    const unsubscribe = subscribeToExpenses((expensesData) => {
      setExpenses(expensesData);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to cash register closures
  useEffect(() => {
    const unsubscribe = subscribeToCashRegisterClosures((closuresData) => {
      setClosures(closuresData);
    });

    return () => unsubscribe();
  }, []);

  const dateFilters = ['Hoy', 'Semana', 'Mes', 'Año'];

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  // Forzar filtro "Hoy" cuando se entra a la tab "Corte de Caja"
  useEffect(() => {
    if (activeTab === 'corte') {
      setActiveFilter('Hoy');
    }
  }, [activeTab]);

  // Get filtered orders for cash register based on date filter
  const getFilteredOrders = () => {
    const now = new Date();
    let startDate, endDate;

    switch (activeFilter) {
      case 'Hoy':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'Semana': {
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      }
      case 'Mes':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'Año':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
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

  // Get filtered expenses based on date filter
  const getFilteredExpenses = () => {
    const now = new Date();
    let startDate, endDate;

    switch (activeFilter) {
      case 'Hoy':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'Semana': {
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      }
      case 'Mes':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'Año':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    return expenses.filter(expense => {
      if (!expense.date) return false;
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  };

  const filteredExpenses = getFilteredExpenses();

  // Get filtered closures based on date filter
  const getFilteredClosures = () => {
    const now = new Date();
    let startDate, endDate;

    switch (activeFilter) {
      case 'Hoy':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'Semana': {
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      }
      case 'Mes':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'Año':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    const filtered = closures.filter(closure => {
      if (!closure.fechaCorte) return false;
      const closureDate = new Date(closure.fechaCorte);
      return closureDate >= startDate && closureDate <= endDate;
    });

    // Debug log
    console.log('=== CLOSURES DEBUG ===');
    console.log('Total closures:', closures.length);
    console.log('Filter:', activeFilter);
    console.log('Date range:', startDate, 'to', endDate);
    console.log('Filtered closures:', filtered.length);
    if (filtered.length > 0) {
      console.log('Sample closure:', filtered[0]);
    }

    return filtered;
  };

  const filteredClosures = getFilteredClosures();

  // Calculate statistics from closures
  const calculateStatsFromClosures = () => {
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalOrders = 0;

    filteredClosures.forEach(closure => {
      totalRevenue += parseFloat(closure.resultados?.ingresosTotal || 0);
      totalExpenses += parseFloat(closure.resultados?.gastosTotal || 0);
      totalOrders += parseInt(closure.totalOrdenes || 0);
    });

    const totalProfit = totalRevenue - totalExpenses;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue,
      totalExpenses,
      totalProfit,
      totalOrders,
      averageTicket
    };
  };

  // Get expenses from closures for ExpensesByCategoryChart
  const getExpensesFromClosures = () => {
    const allExpenses = [];
    filteredClosures.forEach(closure => {
      if (closure.gastos?.items) {
        allExpenses.push(...closure.gastos.items);
      }
    });
    return allExpenses;
  };

  // Calculate period comparison from closures
  const calculatePeriodComparisonFromClosures = () => {
    const now = new Date();
    let currentStart, currentEnd, previousStart, previousEnd;

    switch (activeFilter) {
      case 'Hoy':
        currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        break;
      case 'Semana': {
        const dayOfWeek = now.getDay();
        currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
        currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek - 7, 0, 0, 0, 0);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek - 1, 23, 59, 59, 999);
        break;
      }
      case 'Mes':
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'Año':
        currentStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        currentEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        previousStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      default:
        currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    }

    const calculatePeriodDataFromClosures = (startDate, endDate) => {
      const periodClosures = closures.filter(closure => {
        if (!closure.fechaCorte) return false;
        const closureDate = new Date(closure.fechaCorte);
        return closureDate >= startDate && closureDate <= endDate;
      });

      let revenue = 0;
      let expenses = 0;

      periodClosures.forEach(closure => {
        revenue += parseFloat(closure.resultados?.ingresosTotal || 0);
        expenses += parseFloat(closure.resultados?.gastosTotal || 0);
      });

      return {
        revenue,
        expenses,
        profit: revenue - expenses
      };
    };

    return {
      current: calculatePeriodDataFromClosures(currentStart, currentEnd),
      previous: calculatePeriodDataFromClosures(previousStart, previousEnd)
    };
  };

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
      // Use clientId as key to avoid grouping clients with same name
      const clientId = order.clientId || order.client || 'sin-id';
      const clientName = order.client || 'Sin nombre';
      const total = parseFloat(order.totalPrice) || 0;
      const advance = parseFloat(order.advancePayment) || 0;

      let revenue = 0;
      if (order.paymentStatus === 'paid') {
        revenue = total;
      } else if (order.paymentStatus === 'partial') {
        revenue = advance;
      }

      if (!clientData[clientId]) {
        clientData[clientId] = {
          name: clientName,
          orders: 0,
          revenue: 0
        };
      }

      clientData[clientId].orders += 1;
      clientData[clientId].revenue += revenue;
    });

    // Sort by revenue and get top 5
    return Object.entries(clientData)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([id, data], index) => ({
        rank: index + 1,
        name: data.name,
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

  // Calculate period comparison data (current vs previous)
  const calculatePeriodComparison = () => {
    const now = new Date();
    let currentStart, currentEnd, previousStart, previousEnd;

    switch (activeFilter) {
      case 'Hoy':
        currentStart = new Date(now.setHours(0, 0, 0, 0));
        currentEnd = new Date(now.setHours(23, 59, 59, 999));
        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 1);
        previousEnd = new Date(previousStart);
        previousEnd.setHours(23, 59, 59, 999);
        break;
      case 'Semana': {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        currentStart = new Date(startOfWeek.setHours(0, 0, 0, 0));
        currentEnd = new Date();
        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 7);
        previousEnd = new Date(currentStart);
        previousEnd.setSeconds(previousEnd.getSeconds() - 1);
        break;
      }
      case 'Mes':
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'Año':
        currentStart = new Date(now.getFullYear(), 0, 1);
        currentEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        break;
      default:
        currentStart = new Date(now.setHours(0, 0, 0, 0));
        currentEnd = new Date(now.setHours(23, 59, 59, 999));
        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 1);
        previousEnd = new Date(previousStart);
        previousEnd.setHours(23, 59, 59, 999);
    }

    // Helper function to calculate data for a period
    const calculatePeriodData = (startDate, endDate) => {
      // Get all orders
      const allOrders = [
        ...orders.recibidos,
        ...orders.proceso,
        ...orders.listos,
        ...orders.enEntrega,
        ...orders.completados
      ];

      // Filter orders by date
      const periodOrders = allOrders.filter(order => {
        if (!order.completedDate) return false;
        const orderDate = new Date(order.completedDate);
        return orderDate >= startDate && orderDate <= endDate;
      });

      // Calculate revenue
      let revenue = 0;
      periodOrders.forEach(order => {
        const total = parseFloat(order.totalPrice) || 0;
        const advance = parseFloat(order.advancePayment) || 0;

        if (order.paymentStatus === 'paid') {
          revenue += total;
        } else if (order.paymentStatus === 'partial') {
          revenue += advance;
        }
      });

      // Filter expenses by date
      const periodExpenses = expenses.filter(expense => {
        if (!expense.date) return false;
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      });

      // Calculate total expenses
      const totalExpenses = periodExpenses.reduce((sum, expense) => {
        return sum + (parseFloat(expense.amount) || 0);
      }, 0);

      return {
        revenue,
        expenses: totalExpenses,
        profit: revenue - totalExpenses
      };
    };

    return {
      current: calculatePeriodData(currentStart, currentEnd),
      previous: calculatePeriodData(previousStart, previousEnd)
    };
  };

  const periodComparison = calculatePeriodComparison();

  // Calculate total expenses
  const calculateTotalExpenses = () => {
    return filteredExpenses.reduce((sum, expense) => {
      return sum + (parseFloat(expense.amount) || 0);
    }, 0);
  };

  const totalExpenses = calculateTotalExpenses();
  const totalProfit = stats.totalRevenue - totalExpenses;

  // Format stats for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

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
        filters={
          activeTab === 'reportes'
            ? dateFilters.map((filter) => ({
                label: filter,
                onClick: () => handleFilterChange(filter),
                active: activeFilter === filter
              }))
            : [] // Ocultar filtros en tabs "corte" e "historial"
        }
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
          {/* Data Source Toggle */}
          <div className="reports-data-source-wrapper">
            <DataSourceToggle
              value={dataSource}
              onChange={setDataSource}
            />
          </div>

          {/* KPI Stats Cards */}
          <div className="reports-stats-grid">
            <StatCard
              icon="💰"
              label="Total Ingresos"
              value={formatCurrency(
                dataSource === 'cortes'
                  ? calculateStatsFromClosures().totalRevenue
                  : stats.totalRevenue
              )}
              type="ingresos"
            />
            <StatCard
              icon="💸"
              label="Total Gastos"
              value={formatCurrency(
                dataSource === 'cortes'
                  ? calculateStatsFromClosures().totalExpenses
                  : totalExpenses
              )}
              type="gastos"
            />
            <StatCard
              icon="💵"
              label="Ganancia Neta"
              value={formatCurrency(
                dataSource === 'cortes'
                  ? calculateStatsFromClosures().totalProfit
                  : totalProfit
              )}
              type="ganancia"
            />
            <StatCard
              icon="💳"
              label="Ticket Promedio"
              value={formatCurrency(
                dataSource === 'cortes'
                  ? calculateStatsFromClosures().averageTicket
                  : stats.averageTicket
              )}
              type="ticket-promedio"
            />
          </div>

          {/* Analysis Section Title */}
          <div className="reports-section-title">
            <span className="reports-section-icon">📊</span>
            Análisis de Ingresos
          </div>

          {/* Revenue Analysis Charts */}
          <div className="reports-charts-grid-2col">
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

            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title">Métodos de Pago</div>
                  <div className="chart-subtitle">Distribución de ingresos</div>
                </div>
              </div>
              <div style={{ height: '300px', padding: '20px' }}>
                <PaymentMethodsChart orders={filteredOrders} />
              </div>
            </div>
          </div>

          {/* Expenses Section Title */}
          <div className="reports-section-title">
            <span className="reports-section-icon">💸</span>
            Análisis de Gastos
          </div>

          {/* Expenses Chart */}
          <div className="reports-charts-grid-1col">
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title">Gastos por Categoría</div>
                  <div className="chart-subtitle">
                    {dataSource === 'cortes'
                      ? `${getExpensesFromClosures().length} ${getExpensesFromClosures().length === 1 ? 'gasto' : 'gastos'} registrados`
                      : `${filteredExpenses.length} ${filteredExpenses.length === 1 ? 'gasto' : 'gastos'} registrados`
                    }
                  </div>
                </div>
              </div>
              <div style={{ height: '300px', padding: '20px' }}>
                <ExpensesByCategoryChart
                  expenses={dataSource === 'cortes' ? getExpensesFromClosures() : filteredExpenses}
                />
              </div>
            </div>
          </div>

          {/* Trends Section Title */}
          <div className="reports-section-title">
            <span className="reports-section-icon">📈</span>
            Tendencias y Comparación
          </div>

          {/* Trends and Comparison Charts */}
          <div className="reports-charts-grid-2col">
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title">Tendencia de Ganancia</div>
                  <div className="chart-subtitle">Ingresos - Gastos</div>
                </div>
              </div>
              <div style={{ height: '300px', padding: '20px' }}>
                <ProfitTrendChart
                  orders={filteredOrders}
                  expenses={dataSource === 'cortes' ? getExpensesFromClosures() : filteredExpenses}
                  dateFilter={activeFilter}
                />
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title">Comparación de Períodos</div>
                  <div className="chart-subtitle">Actual vs Anterior</div>
                </div>
              </div>
              <div style={{ height: '300px', padding: '20px' }}>
                <PeriodComparisonChart
                  currentData={
                    dataSource === 'cortes'
                      ? calculatePeriodComparisonFromClosures().current
                      : periodComparison.current
                  }
                  previousData={
                    dataSource === 'cortes'
                      ? calculatePeriodComparisonFromClosures().previous
                      : periodComparison.previous
                  }
                  dateFilter={activeFilter}
                />
              </div>
            </div>
          </div>

          {/* Services Section Title */}
          <div className="reports-section-title">
            <span className="reports-section-icon">🔥</span>
            Servicios Populares
          </div>

          {/* Services Chart */}
          <div className="reports-charts-grid-1col">
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title">Servicios Más Vendidos</div>
                  <div className="chart-subtitle">Top 6 servicios</div>
                </div>
              </div>
              <div style={{ height: '300px', padding: '20px' }}>
                <ServicesChart orders={filteredOrders} />
              </div>
            </div>
          </div>

          {/* Top Lists */}
          <div className="lists-grid">
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
