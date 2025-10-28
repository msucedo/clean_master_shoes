import { useState, useRef, useEffect } from 'react';
import { subscribeToClients } from '../services/firebaseService';
import './ClientAutocomplete.css';

const ClientAutocomplete = ({ value, onChange, onSelectClient, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);
  const [clients, setClients] = useState([]);
  const wrapperRef = useRef(null);

  // Subscribe to real-time clients updates
  useEffect(() => {
    const unsubscribe = subscribeToClients((clientsData) => {
      setClients(clientsData);
    });

    return () => unsubscribe();
  }, []);

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
    let filtered;

    if (value.trim() === '') {
      // Mostrar todos los clientes cuando está vacío
      filtered = [...clients];
    } else {
      // Filtrar clientes por nombre o teléfono
      filtered = clients.filter(client =>
        client.name.toLowerCase().includes(value.toLowerCase()) ||
        client.phone.includes(value)
      );
    }

    // Ordenar alfabéticamente por nombre
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredClients(filtered);
  }, [value, clients]);

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
