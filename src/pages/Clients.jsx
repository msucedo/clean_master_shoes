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

  // Calcular métricas de clientes basadas en órdenes
  const clientMetrics = useMemo(() => {
    const metrics = new Map();

    // Inicializar métricas para todos los clientes
    clients.forEach(client => {
      metrics.set(client.id, {
        orders: 0,
        debt: 0,
        totalSpent: 0,
        isVip: false,
        isActive: false
      });
    });

    // Calcular desde todas las órdenes
    const allOrderStatuses = ['recibidos', 'proceso', 'listos', 'enEntrega', 'completados'];

    allOrderStatuses.forEach(status => {
      if (orders[status]) {
        orders[status].forEach(order => {
          // Encontrar el cliente por nombre
          const client = clients.find(c =>
            c.name.toLowerCase() === order.client.toLowerCase()
          );

          if (client && metrics.has(client.id)) {
            const metric = metrics.get(client.id);

            // Incrementar contador de órdenes
            metric.orders += 1;

            // Si es orden activa (no completada)
            if (status !== 'completados') {
              metric.isActive = true;

              // Calcular deuda (solo órdenes activas con pago pendiente o parcial)
              if (order.paymentStatus === 'pending') {
                metric.debt += (order.totalPrice || 0);
              } else if (order.paymentStatus === 'partial') {
                const remaining = (order.totalPrice || 0) - (order.advancePayment || 0);
                metric.debt += remaining;
              }
            }

            // Sumar al total gastado (órdenes completadas y pagadas)
            if (status === 'completados' && order.paymentStatus === 'paid') {
              metric.totalSpent += (order.totalPrice || 0);
            }
          }
        });
      }
    });

    // Determinar clientes VIP basado en criterios
    metrics.forEach((metric, clientId) => {
      // Criterios para ser VIP:
      // - 10 o más órdenes completadas, O
      // - $5000 o más en gasto total, O
      // - 15 o más órdenes en total
      metric.isVip = metric.orders >= 10 || metric.totalSpent >= 5000 || metric.orders >= 15;
    });

    return metrics;
  }, [clients, orders]);


  const filterClients = (clientsList) => {
    let filtered = clientsList;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
      );
    }

    // Apply type filter usando métricas calculadas
    if (activeFilter === 'debt') {
      filtered = filtered.filter(client => {
        const metrics = clientMetrics.get(client.id);
        return metrics && metrics.debt > 0;
      });
    } else if (activeFilter === 'vip') {
      filtered = filtered.filter(client => {
        const metrics = clientMetrics.get(client.id);
        return metrics && metrics.isVip;
      });
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
          filteredClients.map((client) => {
            const metrics = clientMetrics.get(client.id) || {
              orders: 0,
              debt: 0,
              totalSpent: 0,
              isVip: false,
              isActive: false
            };

            // Enriquecer cliente con métricas calculadas
            const enrichedClient = {
              ...client,
              orders: metrics.orders,
              debt: metrics.debt,
              isVip: metrics.isVip,
              isActive: metrics.isActive
            };

            return (
              <ClientItem
                key={client.id}
                client={enrichedClient}
                onClick={(client) => {
                  setEditingClient(client);
                  setIsModalOpen(true);
                }}
              />
            );
          })
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
