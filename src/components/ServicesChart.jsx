import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const ServicesChart = ({ orders }) => {
  // Group orders by service and calculate totals
  const getChartData = () => {
    const serviceData = {};

    orders.forEach(order => {
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
    const sortedServices = Object.entries(serviceData)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 6); // Top 6 services

    const colors = [
      'rgba(255, 71, 87, 0.9)',   // Primary red
      'rgba(0, 217, 163, 0.9)',   // Green
      'rgba(0, 217, 255, 0.9)',   // Blue
      'rgba(255, 215, 0, 0.9)',   // Gold
      'rgba(255, 140, 0, 0.9)',   // Orange
      'rgba(138, 43, 226, 0.9)',  // Purple
    ];

    const borderColors = [
      'rgb(255, 71, 87)',
      'rgb(0, 217, 163)',
      'rgb(0, 217, 255)',
      'rgb(255, 215, 0)',
      'rgb(255, 140, 0)',
      'rgb(138, 43, 226)',
    ];

    return {
      labels: sortedServices.map(([name]) => name),
      datasets: [
        {
          label: 'Ventas',
          data: sortedServices.map(([, data]) => data.revenue),
          backgroundColor: colors,
          borderColor: borderColors,
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
              `Ventas: ${new Intl.NumberFormat('es-MX', {
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

  return <Doughnut options={options} data={data} />;
};

ServicesChart.propTypes = {
  orders: PropTypes.array.isRequired
};

export default ServicesChart;
