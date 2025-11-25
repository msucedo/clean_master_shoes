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

const ExpensesByCategoryChart = ({ expenses }) => {
  const getCategoryLabel = (category) => {
    const labels = {
      general: 'General',
      supplies: 'Insumos',
      salary: 'Nómina',
      services: 'Servicios',
      equipment: 'Equipo',
      maintenance: 'Mantenimiento',
      other: 'Otro'
    };
    return labels[category] || 'General';
  };

  // Calculate expenses by category
  const getChartData = () => {
    const categoryData = {
      general: 0,
      supplies: 0,
      salary: 0,
      services: 0,
      equipment: 0,
      maintenance: 0,
      other: 0
    };

    expenses.forEach(expense => {
      const category = expense.category || 'general';
      const amount = parseFloat(expense.amount) || 0;

      if (categoryData.hasOwnProperty(category)) {
        categoryData[category] += amount;
      } else {
        categoryData.other += amount;
      }
    });

    // Filter out categories with no expenses and sort by amount
    const sortedCategories = Object.entries(categoryData)
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]);

    const colors = [
      'rgba(239, 68, 68, 0.8)',   // Red
      'rgba(251, 146, 60, 0.8)',  // Orange
      'rgba(245, 158, 11, 0.8)',  // Amber
      'rgba(132, 204, 22, 0.8)',  // Lime
      'rgba(34, 197, 94, 0.8)',   // Green
      'rgba(6, 182, 212, 0.8)',   // Cyan
      'rgba(139, 92, 246, 0.8)',  // Purple
    ];

    return {
      labels: sortedCategories.map(([cat]) => getCategoryLabel(cat)),
      datasets: [
        {
          label: 'Gastos',
          data: sortedCategories.map(([, amount]) => amount),
          backgroundColor: colors.slice(0, sortedCategories.length),
          borderColor: colors.slice(0, sortedCategories.length).map(c => c.replace('0.8', '1')),
          borderWidth: 2,
          borderRadius: 8,
        }
      ]
    };
  };

  const options = {
    indexAxis: 'y', // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(239, 68, 68, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const value = context.parsed.x || 0;
            return `Gastos: ${new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN'
            }).format(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
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
        }
      },
      y: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: '#fff',
          font: {
            size: 12,
            weight: '600'
          }
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
        No hay gastos para mostrar
      </div>
    );
  }

  return <Bar options={options} data={data} />;
};

ExpensesByCategoryChart.propTypes = {
  expenses: PropTypes.array.isRequired
};

export default ExpensesByCategoryChart;
