import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ProfitTrendChart = ({ orders, expenses, dateFilter }) => {
  // Group data by date and calculate profit (revenue - expenses)
  const getChartData = () => {
    const dataByDate = {};

    // Group revenue from orders
    orders.forEach(order => {
      if (!order.completedDate) return;

      const date = new Date(order.completedDate);
      let dateKey;

      // Format date based on filter
      switch (dateFilter) {
        case 'Hoy':
          // Group by hour
          dateKey = `${date.getHours()}:00`;
          break;
        case 'Semana':
          // Group by day of week
          const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
          dateKey = daysOfWeek[date.getDay()];
          break;
        case 'Mes':
          // Group by day of month
          dateKey = date.getDate();
          break;
        case 'Año':
          // Group by month
          const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          dateKey = months[date.getMonth()];
          break;
        default:
          dateKey = date.toLocaleDateString('es-MX');
      }

      const amount = parseFloat(order.totalPrice) || 0;
      const advance = parseFloat(order.advancePayment) || 0;

      let revenue = 0;
      if (order.paymentStatus === 'paid') {
        revenue = amount;
      } else if (order.paymentStatus === 'partial') {
        revenue = advance;
      }

      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = { revenue: 0, expenses: 0 };
      }
      dataByDate[dateKey].revenue += revenue;
    });

    // Group expenses
    expenses.forEach(expense => {
      if (!expense.date) return;

      const date = new Date(expense.date);
      let dateKey;

      // Format date based on filter
      switch (dateFilter) {
        case 'Hoy':
          dateKey = `${date.getHours()}:00`;
          break;
        case 'Semana':
          const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
          dateKey = daysOfWeek[date.getDay()];
          break;
        case 'Mes':
          dateKey = date.getDate();
          break;
        case 'Año':
          const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          dateKey = months[date.getMonth()];
          break;
        default:
          dateKey = date.toLocaleDateString('es-MX');
      }

      const amount = parseFloat(expense.amount) || 0;

      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = { revenue: 0, expenses: 0 };
      }
      dataByDate[dateKey].expenses += amount;
    });

    // Calculate profit for each date
    const profitByDate = {};
    Object.keys(dataByDate).forEach(key => {
      profitByDate[key] = dataByDate[key].revenue - dataByDate[key].expenses;
    });

    // Sort keys appropriately
    let sortedKeys = Object.keys(profitByDate);

    if (dateFilter === 'Mes') {
      sortedKeys.sort((a, b) => parseInt(a) - parseInt(b));
    }

    return {
      labels: sortedKeys,
      datasets: [
        {
          label: 'Ganancia',
          data: sortedKeys.map(key => profitByDate[key]),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }
      ]
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(34, 197, 94, 0.5)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const formattedValue = new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN'
            }).format(Math.abs(value));

            return value >= 0
              ? `Ganancia: ${formattedValue}`
              : `Pérdida: ${formattedValue}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          color: '#666',
          callback: function(value) {
            return '$' + value.toLocaleString('es-MX');
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        }
      },
      x: {
        ticks: {
          color: '#666',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        }
      }
    }
  };

  const data = getChartData();

  if (data.labels.length === 0) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        fontSize: '14px'
      }}>
        No hay datos para mostrar
      </div>
    );
  }

  return <Line options={options} data={data} />;
};

ProfitTrendChart.propTypes = {
  orders: PropTypes.array.isRequired,
  expenses: PropTypes.array.isRequired,
  dateFilter: PropTypes.string.isRequired
};

export default ProfitTrendChart;
