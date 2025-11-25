import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PeriodComparisonChart = ({ currentData, previousData, dateFilter }) => {
  const getPeriodLabel = () => {
    switch (dateFilter) {
      case 'Hoy':
        return { current: 'Hoy', previous: 'Ayer' };
      case 'Semana':
        return { current: 'Esta semana', previous: 'Semana pasada' };
      case 'Mes':
        return { current: 'Este mes', previous: 'Mes pasado' };
      case 'Año':
        return { current: 'Este año', previous: 'Año pasado' };
      default:
        return { current: 'Actual', previous: 'Anterior' };
    }
  };

  const getChartData = () => {
    const periodLabels = getPeriodLabel();

    return {
      labels: ['Ingresos', 'Gastos', 'Ganancia'],
      datasets: [
        {
          label: periodLabels.current,
          data: [
            currentData.revenue || 0,
            currentData.expenses || 0,
            currentData.profit || 0
          ],
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2,
          borderRadius: 8,
        },
        {
          label: periodLabels.previous,
          data: [
            previousData.revenue || 0,
            previousData.expenses || 0,
            previousData.profit || 0
          ],
          backgroundColor: 'rgba(100, 116, 139, 0.6)',
          borderColor: 'rgb(100, 116, 139)',
          borderWidth: 2,
          borderRadius: 8,
        }
      ]
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#fff',
          padding: 15,
          font: {
            size: 12,
            weight: '600'
          },
          boxWidth: 15,
          boxHeight: 15,
          usePointStyle: true,
          pointStyle: 'rect'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(34, 197, 94, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y || 0;
            const formattedValue = new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN'
            }).format(Math.abs(value));

            return `${context.dataset.label}: ${formattedValue}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#999',
          font: {
            size: 11
          },
          callback: function(value) {
            return new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
              notation: 'compact',
              compactDisplay: 'short'
            }).format(value);
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        }
      },
      x: {
        ticks: {
          color: '#fff',
          font: {
            size: 12,
            weight: '600'
          }
        },
        grid: {
          display: false,
          drawBorder: false
        }
      }
    }
  };

  const data = getChartData();

  // Check if both current and previous data are empty
  const hasData = data.datasets.some(dataset =>
    dataset.data.some(value => value > 0)
  );

  if (!hasData) {
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
        No hay datos para comparar
      </div>
    );
  }

  return <Bar options={options} data={data} />;
};

PeriodComparisonChart.propTypes = {
  currentData: PropTypes.shape({
    revenue: PropTypes.number,
    expenses: PropTypes.number,
    profit: PropTypes.number
  }).isRequired,
  previousData: PropTypes.shape({
    revenue: PropTypes.number,
    expenses: PropTypes.number,
    profit: PropTypes.number
  }).isRequired,
  dateFilter: PropTypes.string.isRequired
};

export default PeriodComparisonChart;
