import './ClientItem.css';

const ClientItem = ({ client, onClick }) => {
  const getInitials = (name) => {
    const names = name.split(' ');
    return names.map(n => n[0]).join('').substring(0, 2).toUpperCase();
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
      <div className="client-last-visit">{client.lastVisit}</div>
      <div className="client-actions">
        <button className="btn-action" title="Llamar">📞</button>
        <button className="btn-action whatsapp" title="WhatsApp">💬</button>
      </div>
    </div>
  );
};

export default ClientItem;
