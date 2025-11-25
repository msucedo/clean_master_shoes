import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const PaymentMethodsChart = ({ orders }) => {
  // Calculate payment method totals
  const getChartData = () => {
    const paymentData = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0
    };

    orders.forEach(order => {
      if (order.paymentStatus === 'paid' || order.paymentStatus === 'partial') {
        const total = parseFloat(order.totalCost) || 0;
        const paymentMethod = order.paymentMethod?.toLowerCase() || 'efectivo';

        if (paymentData.hasOwnProperty(paymentMethod)) {
          paymentData[paymentMethod] += total;
        } else {
          paymentData.efectivo += total;
        }
      }
    });

    const labels = ['Efectivo', 'Tarjeta', 'Transferencia'];
    const values = [
      paymentData.efectivo,
      paymentData.tarjeta,
      paymentData.transferencia
    ];

    // Filter out zero values
    const filteredData = labels.reduce((acc, label, index) => {
      if (values[index] > 0) {
        acc.labels.push(label);
        acc.values.push(values[index]);
      }
      return acc;
    }, { labels: [], values: [] });

    const colors = [
      'rgba(34, 197, 94, 0.9)',   // Green - Efectivo
      'rgba(59, 130, 246, 0.9)',  // Blue - Tarjeta
      'rgba(168, 85, 247, 0.9)',  // Purple - Transferencia
    ];

    const borderColors = [
      'rgb(34, 197, 94)',
      'rgb(59, 130, 246)',
      'rgb(168, 85, 247)',
    ];

    return {
      labels: filteredData.labels,
      datasets: [
        {
          label: 'Ingresos',
          data: filteredData.values,
          backgroundColor: colors.slice(0, filteredData.labels.length),
          borderColor: borderColors.slice(0, filteredData.labels.length),
          borderWidth: 2,
          hoverOffset: 10
        }
      ]
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
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
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 71, 87, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);

            return [
              `${label}`,
              `Ingresos: ${new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN'
              }).format(value)}`,
              `${percentage}% del total`
            ];
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
        No hay datos para mostrar
      </div>
    );
  }

  return <Pie options={options} data={data} />;
};

PaymentMethodsChart.propTypes = {
  orders: PropTypes.array.isRequired
};

export default PaymentMethodsChart;
