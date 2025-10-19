import { useState, useMemo, useEffect } from 'react';
import ClientItem from '../components/ClientItem';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';
import PageHeader from '../components/PageHeader';
import {
  subscribeToOrders,
  subscribeToClients,
  addClient,
  updateClient,
  deleteClient
} from '../services/firebaseService';
import './Clients.css';

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState({
    recibidos: [],
    proceso: [],
    listos: [],
    enEntrega: [],
    completados: []
  });

  // Subscribe to real-time clients updates
  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToClients((clientsData) => {
      setClients(clientsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to real-time orders for active clients filter
  useEffect(() => {
    const unsubscribe = subscribeToOrders((ordersData) => {
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  // Obtener clientes con órdenes activas
  const activeClientNames = useMemo(() => {
    const activeClients = new Set();

    // Recorrer órdenes activas (no completadas)
    ['recibidos', 'proceso', 'listos', 'enEntrega'].forEach(status => {
      if (orders[status]) {
        orders[status].forEach(order => {
          activeClients.add(order.client.toLowerCase());
        });
      }
    });

    return activeClients;
  }, [orders]);

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
    } else if (activeFilter === 'active') {
      filtered = filtered.filter(client =>
        activeClientNames.has(client.name.toLowerCase())
      );
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

  const handleSubmitClient = async (formData) => {
    try {
      if (editingClient) {
        // Edit existing client
        await updateClient(editingClient.id, formData);
      } else {
        // Create new client
        const newClient = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || '',
          notes: formData.notes || '',
          lastVisit: new Date().toISOString()
        };
        await addClient(newClient);
      }
      handleCloseModal();
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error al guardar el cliente');
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await deleteClient(clientId);
        handleCloseModal();
        // Real-time listener will update the UI automatically
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Error al eliminar el cliente');
      }
    }
  };

  const filteredClients = filterClients(clients);

  return (
    <div className="clients-page">
      {/* Header */}
      <PageHeader
        title="Clientes"
        buttonLabel="Agregar Cliente"
        buttonIcon="➕"
        onButtonClick={handleOpenNewClient}
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar cliente por nombre o teléfono..."
        filters={[
          {
            label: 'Todos',
            onClick: () => setActiveFilter('all'),
            active: activeFilter === 'all'
          },
          {
            label: '🔥 Clientes Activos',
            onClick: () => setActiveFilter('active'),
            active: activeFilter === 'active'
          },
          {
            label: 'Con Deuda',
            onClick: () => setActiveFilter('debt'),
            active: activeFilter === 'debt'
          },
          {
            label: 'Clientes VIP',
            onClick: () => setActiveFilter('vip'),
            active: activeFilter === 'vip'
          }
        ]}
      />

      {/* Clients List */}
      <div className="clients-list">
        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <div className="empty-text">Cargando clientes...</div>
          </div>
        ) : filteredClients.length > 0 ? (
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
              {clients.length === 0 && searchTerm === '' && activeFilter === 'all'
                ? 'Agrega tu primer cliente'
                : 'Intenta ajustar tus filtros o búsqueda'}
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
