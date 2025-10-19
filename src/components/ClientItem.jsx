import './ClientItem.css';

const ClientItem = ({ client, onClick }) => {
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

  const hasDebt = client.debt > 0;

  return (
    <div className="client-item" onClick={() => onClick && onClick(client)}>
      <div className={`client-avatar ${client.isVip ? 'vip' : ''}`}>
        {getInitials(client.name)}
      </div>
      <div className="client-info">
        <div className="client-name">{client.name}</div>
        <div className="client-phone">{client.phone}</div>
      </div>
      <div className="client-meta">
        <div className="client-meta-item">
          <div className="client-meta-value">{client.orders}</div>
          <div className="client-meta-label">Órdenes</div>
        </div>
        <div className="client-meta-item">
          <div className={`client-meta-value ${hasDebt ? 'debt' : ''}`}>
            ${client.debt}
          </div>
          <div className="client-meta-label">Debe</div>
        </div>
      </div>
      <div className="client-last-visit">{getRelativeTime(client.lastVisit)}</div>
      <div className="client-actions">
        <button
          className={`btn-action active-order ${!client.isActive ? 'invisible' : ''}`}
          title={client.isActive ? "Tiene zapatos en el negocio" : ""}
          disabled={!client.isActive}
        >
          👟
        </button>
        <button className="btn-action whatsapp" title="WhatsApp (próximamente)">💬</button>
      </div>
    </div>
  );
};

export default ClientItem;
