import { useState } from 'react';
import StatCard from '../components/StatCard';
import TaskCard from '../components/TaskCard';
import './Dashboard.css';

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Obtener fecha dinámica
  const getCurrentDate = () => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const today = new Date();
    const dayName = days[today.getDay()];
    const day = today.getDate();
    const month = months[today.getMonth()];
    const year = today.getFullYear();

    return `${dayName}, ${day} de ${month} ${year}`;
  };

  const handleNewOrder = () => {
    console.log('Open new order form');
  };

  const stats = [
    { icon: '📦', label: 'Para Entregar', value: '3', type: 'entregas' },
    { icon: '🔄', label: 'En Proceso', value: '8', type: 'proceso' },
    { icon: '💰', label: 'Pagos Pendientes', value: '2', type: 'pagos' },
    { icon: '💵', label: 'Ingresos Hoy', value: '$500', type: 'ingresos' },
  ];

  const deliveryTasks = [
    {
      id: '00123',
      badge: 'HOY',
      badgeType: 'today',
      client: 'Juan Pérez',
      model: 'Nike Air Max 90',
      service: 'Lavado Profundo',
      price: '250',
      action: 'Entregar',
      actionType: 'success'
    },
    {
      id: '00126',
      badge: 'HOY',
      badgeType: 'today',
      client: 'Ana Martínez',
      model: 'Puma RS-X',
      service: 'Lavado Express',
      price: '100',
      action: 'Entregar',
      actionType: 'success'
    },
    {
      id: '00128',
      badge: 'URGENTE',
      badgeType: 'urgent',
      client: 'Patricia Sánchez',
      model: 'Converse Chuck Taylor',
      service: 'Lavado Básico',
      price: '150',
      action: 'Cobrar',
      actionType: ''
    }
  ];

  return (
    <div className="dashboard">
      {/* Header with welcome message */}
      <div className="hero-section">
        <div className="welcome-text">
          <div className="welcome-greeting">{getCurrentDate()}</div>
          <h1 className="welcome-title">Bienvenido de nuevo</h1>
        </div>
      </div>


      {/* Quick Stats */}
      <div className="quick-stats">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Priority Tasks */}
      <div className="priority-section">
        {/* Entregas de Hoy */}
        <div className="task-group">
          <div className="task-group-header">
            <div className="task-group-icon entregas">📦</div>
            <div className="task-group-title-wrapper">
              <div className="task-group-name">Para Entregar Hoy</div>
              <div className="task-group-count">3 clientes esperando</div>
            </div>
          </div>
          <div className="task-cards">
            {deliveryTasks.map((task) => (
              <TaskCard key={task.id} {...task} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
