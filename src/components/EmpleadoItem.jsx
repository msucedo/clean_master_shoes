import './EmpleadoItem.css';

const EmpleadoItem = ({ empleado, onClick }) => {
  const getInitials = (name) => {
    const names = name.split(' ');
    return names.map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Nunca';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Hace 1 día';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    if (diffInDays < 14) return 'Hace 1 semana';
    if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`;
    if (diffInDays < 60) return 'Hace 1 mes';
    if (diffInDays < 365) return `Hace ${Math.floor(diffInDays / 30)} meses`;
    return `Hace ${Math.floor(diffInDays / 365)} años`;
  };

  const isActive = empleado.status === 'active';

  return (
    <div className="empleado-item" onClick={() => onClick && onClick(empleado)}>
      <div className={`empleado-avatar ${!isActive ? 'inactive' : ''}`}>
        {getInitials(empleado.name)}
      </div>
      <div className="empleado-info">
        <div className="empleado-name">{empleado.name}</div>
        <div className="empleado-role">{empleado.role || 'Sin rol asignado'}</div>
      </div>
      <div className="empleado-meta">
        <div className="empleado-meta-item">
          <div className="empleado-meta-value">{empleado.phone}</div>
          <div className="empleado-meta-label">Teléfono</div>
        </div>
        <div className="empleado-meta-item">
          <div className="empleado-meta-value">
            {empleado.salary ? `$${empleado.salary}` : 'No definido'}
          </div>
          <div className="empleado-meta-label">Salario</div>
        </div>
      </div>
      <div className="empleado-hire-date">{getRelativeTime(empleado.hireDate)}</div>
      <div className="empleado-status">
        <span className={`status-badge ${empleado.status || 'active'}`}>
          {empleado.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      </div>
    </div>
  );
};

export default EmpleadoItem;
