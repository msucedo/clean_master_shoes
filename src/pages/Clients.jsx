import { useState } from 'react';
import ClientItem from '../components/ClientItem';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';
import './Clients.css';

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const [clients, setClients] = useState([
    {
      id: 1,
      name: 'Jorge Hernández',
      phone: '555-123-4567',
      email: 'jorge.hernandez@email.com',
      orders: 24,
      debt: 0,
      lastVisit: 'Hace 2 días',
      isVip: true
    },
    {
      id: 2,
      name: 'Juan Pérez',
      phone: '123-456-7890',
      email: '',
      orders: 8,
      debt: 0,
      lastVisit: 'Hoy',
      isVip: false
    },
    {
      id: 3,
      name: 'María García',
      phone: '098-765-4321',
      email: 'maria.garcia@email.com',
      orders: 5,
      debt: 150,
      lastVisit: 'Hace 3 días',
      isVip: false
    },
    {
      id: 4,
      name: 'Ana Martínez',
      phone: '555-987-6543',
      email: 'ana.martinez@email.com',
      orders: 18,
      debt: 0,
      lastVisit: 'Ayer',
      isVip: true
    },
    {
      id: 5,
      name: 'Carlos López',
      phone: '555-123-4567',
      email: '',
      orders: 3,
      debt: 400,
      lastVisit: 'Hace 5 días',
      isVip: false
    },
    {
      id: 6,
      name: 'Patricia Sánchez',
      phone: '555-369-2580',
      email: 'patricia.sanchez@email.com',
      orders: 12,
      debt: 0,
      lastVisit: 'Hace 1 semana',
      isVip: true
    },
    {
      id: 7,
      name: 'Luis Ramírez',
      phone: '555-246-8135',
      email: '',
      orders: 1,
      debt: 0,
      lastVisit: 'Hoy',
      isVip: false
    },
    {
      id: 8,
      name: 'Fernando Cruz',
      phone: '555-147-8520',
      email: 'fernando.cruz@email.com',
      orders: 6,
      debt: 0,
      lastVisit: 'Hace 4 días',
      isVip: false
    },
    {
      id: 9,
      name: 'Isabel Ramos',
      phone: '555-753-9510',
      email: 'isabel.ramos@email.com',
      orders: 22,
      debt: 0,
      lastVisit: 'Hace 1 día',
      isVip: true
    },
    {
      id: 10,
      name: 'Sofía Torres',
      phone: '555-159-7530',
      email: '',
      orders: 4,
      debt: 0,
      lastVisit: 'Hace 2 semanas',
      isVip: false
    }
  ]);

  const filterClients = (clientsList) => {
    let filtered = clientsList;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
      );
    }

    // Apply type filter
    if (activeFilter === 'debt') {
      filtered = filtered.filter(client => client.debt > 0);
    } else if (activeFilter === 'vip') {
      filtered = filtered.filter(client => client.isVip);
    }

    return filtered;
  };

  const handleOpenNewClient = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const generateClientId = () => {
    const maxId = clients.reduce((max, client) => {
      return client.id > max ? client.id : max;
    }, 0);
    return maxId + 1;
  };

  const handleSubmitClient = (formData) => {
    if (editingClient) {
      // Edit existing client
      setClients(prev => prev.map(client =>
        client.id === editingClient.id
          ? { ...client, ...formData }
          : client
      ));
    } else {
      // Create new client
      const newClient = {
        id: generateClientId(),
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        notes: formData.notes,
        orders: 0,
        debt: 0,
        lastVisit: 'Hoy',
        isVip: false
      };
      setClients(prev => [newClient, ...prev]);
    }
    handleCloseModal();
  };

  const handleDeleteClient = (clientId) => {
    setClients(prev => prev.filter(client => client.id !== clientId));
  };

  const filteredClients = filterClients(clients);

  return (
    <div className="clients-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-top">
          <h1 className="page-title">Clientes</h1>
          <button className="btn-add-client" onClick={handleOpenNewClient}>
            ➕ Agregar Cliente
          </button>
        </div>

        {/* Search */}
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar cliente por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="filters">
          <button
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Todos
          </button>
          <button
            className={`filter-btn ${activeFilter === 'debt' ? 'active' : ''}`}
            onClick={() => setActiveFilter('debt')}
          >
            Con Deuda
          </button>
          <button
            className={`filter-btn ${activeFilter === 'vip' ? 'active' : ''}`}
            onClick={() => setActiveFilter('vip')}
          >
            Clientes VIP
          </button>
        </div>
      </div>

      {/* Clients List */}
      <div className="clients-list">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <ClientItem
              key={client.id}
              client={client}
              onClick={(client) => {
                setEditingClient(client);
                setIsModalOpen(true);
              }}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">😕</div>
            <div className="empty-text">No se encontraron clientes</div>
            <div className="empty-subtext">
              Intenta ajustar tus filtros o búsqueda
            </div>
          </div>
        )}
      </div>

      {/* Modal for New/Edit Client */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        size="medium"
      >
        <ClientForm
          onSubmit={handleSubmitClient}
          onCancel={handleCloseModal}
          onDelete={handleDeleteClient}
          initialData={editingClient}
        />
      </Modal>
    </div>
  );
};

export default Clients;
