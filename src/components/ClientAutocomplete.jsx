import { useState, useRef, useEffect } from 'react';
import './ClientAutocomplete.css';

const ClientAutocomplete = ({ value, onChange, onSelectClient, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);
  const wrapperRef = useRef(null);

  // Mock data de clientes - en producción esto vendría de tu API/estado global
  const clients = [
    { id: 1, name: 'Jorge Hernández', phone: '555-123-4567', email: 'jorge.hernandez@email.com', isVip: true },
    { id: 2, name: 'Juan Pérez', phone: '123-456-7890', email: '', isVip: false },
    { id: 3, name: 'María García', phone: '098-765-4321', email: 'maria.garcia@email.com', isVip: false },
    { id: 4, name: 'Ana Martínez', phone: '555-987-6543', email: 'ana.martinez@email.com', isVip: true },
    { id: 5, name: 'Carlos López', phone: '555-123-4567', email: '', isVip: false },
    { id: 6, name: 'Patricia Sánchez', phone: '555-369-2580', email: 'patricia.sanchez@email.com', isVip: true },
    { id: 7, name: 'Luis Ramírez', phone: '555-246-8135', email: '', isVip: false },
    { id: 8, name: 'Fernando Cruz', phone: '555-147-8520', email: 'fernando.cruz@email.com', isVip: false },
    { id: 9, name: 'Isabel Ramos', phone: '555-753-9510', email: 'isabel.ramos@email.com', isVip: true },
    { id: 10, name: 'Sofía Torres', phone: '555-159-7530', email: '', isVip: false }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(value.toLowerCase()) ||
        client.phone.includes(value)
      );
      setFilteredClients(filtered);
    }
  }, [value]);

  const handleInputChange = (e) => {
    onChange(e);
    setIsOpen(true);
  };

  const handleSelectClient = (client) => {
    onSelectClient(client);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const getInitials = (name) => {
    const names = name.split(' ');
    return names.map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="client-autocomplete" ref={wrapperRef}>
      <input
        type="text"
        className={`form-input ${error ? 'error' : ''}`}
        placeholder="Buscar o escribir nombre del cliente..."
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        autoComplete="off"
      />

      {isOpen && filteredClients.length > 0 && (
        <div className="autocomplete-dropdown">
          <div className="dropdown-header">
            <span className="dropdown-title">Clientes Registrados</span>
            <span className="dropdown-count">{filteredClients.length}</span>
          </div>
          <div className="dropdown-list">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="dropdown-item"
                onClick={() => handleSelectClient(client)}
              >
                <div className={`client-avatar-small ${client.isVip ? 'vip' : ''}`}>
                  {getInitials(client.name)}
                </div>
                <div className="client-info-small">
                  <div className="client-name-small">
                    {client.name}
                    {client.isVip && <span className="vip-badge">⭐</span>}
                  </div>
                  <div className="client-phone-small">{client.phone}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen && filteredClients.length === 0 && value.trim() !== '' && (
        <div className="autocomplete-dropdown">
          <div className="dropdown-empty">
            <div className="empty-icon">🔍</div>
            <div className="empty-text">No se encontró el cliente</div>
            <div className="empty-subtext">Continúa escribiendo para crear uno nuevo</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientAutocomplete;
