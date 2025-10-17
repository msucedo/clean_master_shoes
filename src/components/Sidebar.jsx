import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { path: '/', icon: '🏠', label: 'Dashboard' },
    { path: '/orders', icon: '📦', label: 'Órdenes' },
    { path: '/clients', icon: '👥', label: 'Clientes' },
    { path: '/services', icon: '💼', label: 'Servicios' },
    { path: '/employees', icon: '👨‍💼', label: 'Empleados' },
    { path: '/catalog', icon: '📚', label: 'Catálogo' },
    { path: '/promotions', icon: '🎉', label: 'Promociones' },
    { path: '/reports', icon: '📊', label: 'Reportes' },
    { path: '/settings', icon: '⚙️', label: 'Config' },
  ];

  return (
    <div className="sidebar">
      <div className="logo">
        <span className="logo-icon">👟</span>
        <span className="logo-text">CLEAN MASTER SHOES</span>
      </div>
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
        >
          <span className="menu-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default Sidebar;
