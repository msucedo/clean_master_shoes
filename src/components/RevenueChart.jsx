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

const RevenueChart = ({ orders, dateFilter }) => {
  // Group orders by date and calculate revenue
  const getChartData = () => {
    const revenueByDate = {};

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

      if (!revenueByDate[dateKey]) {
        revenueByDate[dateKey] = 0;
      }
      revenueByDate[dateKey] += revenue;
    });

    // Sort keys appropriately
    let sortedKeys = Object.keys(revenueByDate);

    if (dateFilter === 'Mes') {
      sortedKeys.sort((a, b) => parseInt(a) - parseInt(b));
    }

    return {
      labels: sortedKeys,
      datasets: [
        {
          label: 'Ingresos',
          data: sortedKeys.map(key => revenueByDate[key]),
          borderColor: 'rgb(255, 71, 87)',
          backgroundColor: 'rgba(255, 71, 87, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(255, 71, 87)',
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
        borderColor: 'rgba(255, 71, 87, 0.5)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `Ingresos: ${new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN'
            }).format(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
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

RevenueChart.propTypes = {
  orders: PropTypes.array.isRequired,
  dateFilter: PropTypes.string.isRequired
};

export default RevenueChart;
