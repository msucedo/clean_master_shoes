import { useState, useMemo, useEffect, useRef } from 'react';
import ClientItem from '../components/ClientItem';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';
import OrderDetailView from '../components/OrderDetailView';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  subscribeToOrders,
  subscribeToClients,
  subscribeToEmployees,
  addClient,
  updateClient,
  deleteClient,
  updateOrder
} from '../services/firebaseService';
import { useNotification } from '../contexts/NotificationContext';
import './Clients.css';

const Clients = () => {
  const { showSuccess, showError, showInfo } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState({
    recibidos: [],
    proceso: [],
    listos: [],
    enEntrega: [],
    completados: []
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'default'
  });

  // Estados para modal de orden
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const saveOnCloseRef = useRef(null);
  const [headerData, setHeaderData] = useState(null);

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

  // Subscribe to real-time employees for author emoji
  useEffect(() => {
    const unsubscribe = subscribeToEmployees((employeesData) => {
      setEmployees(employeesData);
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
        showSuccess('Cliente actualizado exitosamente');
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
        showSuccess('Cliente creado exitosamente');
      }
      handleCloseModal();
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error saving client:', error);
      showError('Error al guardar el cliente. Por favor intenta de nuevo.');
    }
  };

  const handleDeleteClient = (clientId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Cliente',
      message: '¿Estás seguro de eliminar este cliente?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteClient(clientId);
          handleCloseModal();
          showSuccess('Cliente eliminado exitosamente');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          // Real-time listener will update the UI automatically
        } catch (error) {
          console.error('Error deleting client:', error);
          showError('Error al eliminar el cliente');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      }
    });
  };

  // Handlers para órdenes
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    console.log('🚪 [CLIENTS] Cerrando modal de orden', {
      hasSaveOnClose: !!saveOnCloseRef.current
    });

    // Ejecutar guardado si existe (solo guarda si hay cambios)
    if (saveOnCloseRef.current) {
      console.log('💾 [CLIENTS] Ejecutando saveOnClose...');
      saveOnCloseRef.current();
      saveOnCloseRef.current = null; // Limpiar después de usar
    }

    // Cerrar modal
    setIsOrderModalOpen(false);
    setSelectedOrder(null);
  };

  const handleSaveOrder = async (updatedOrder) => {
    console.log('🔥 [FIREBASE] handleSaveOrder llamado con:', updatedOrder);
    try {
      const result = await updateOrder(updatedOrder.id, updatedOrder);
      console.log('✅ [FIREBASE] Orden actualizada exitosamente');

      // Siempre mostrar notificación de orden actualizada
      showSuccess('Orden actualizada exitosamente ✓');

      // Si hubo cambio a "enEntrega", mostrar segunda notificación según resultado del WhatsApp
      if (result.whatsappResult) {
        const whatsapp = result.whatsappResult;

        if (whatsapp.success) {
          showSuccess(`WhatsApp enviado a ${updatedOrder.client} ✓`);
        } else if (whatsapp.skipped) {
          showInfo('WhatsApp no configurado, enviar mensaje manualmente.');
        } else {
          // WhatsApp falló
          showError(
            `WhatsApp falló: ${whatsapp.error || 'Error desconocido'}. ` +
            `Enviar mensaje manualmente a ${updatedOrder.phone}.`
          );
          console.error('❌ [UI] Detalles del error de WhatsApp:', whatsapp);
        }
      }

      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('❌ [FIREBASE] Error saving order:', error);
      showError('Error al guardar la orden. Por favor intenta de nuevo.');
    }
  };

  const handleCancelOrder = (order) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancelar Orden',
      message: `¿Estás seguro de cancelar la orden #${order.orderNumber || order.id}?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          // Excluir campos temporales antes de guardar
          const { currentStatus, ...cleanOrder } = order;

          // Marcar orden como cancelada en lugar de borrarla
          await updateOrder(order.id, {
            ...cleanOrder,
            orderStatus: 'cancelado',
            cancelledAt: new Date().toISOString()
          });

          // IMPORTANTE: Limpiar saveOnCloseRef para evitar sobrescritura
          saveOnCloseRef.current = null;

          handleCloseOrderModal();
          showSuccess('Orden cancelada exitosamente');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          // Real-time listener will update the UI automatically
        } catch (error) {
          console.error('Error cancelling order:', error);
          showError('Error al cancelar la orden');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      }
    });
  };

  const handleEmail = (order) => {
    // TODO: Implementar envío de correo
    showInfo(`Enviar correo a ${order.client}. Se seleccionará plantilla según etapa de la orden.`);
  };

  const handleWhatsApp = (order) => {
    const phone = order.phone.replace(/\D/g, '');
    const message = `Hola ${order.client}, tu orden #${order.orderNumber || order.id} está lista!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    showSuccess('Abriendo WhatsApp...');
  };

  const handleEntregar = (order) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Entregar Orden',
      message: `¿Marcar orden #${order.orderNumber || order.id} como entregada?`,
      type: 'default',
      onConfirm: async () => {
        try {
          // Excluir campos temporales antes de guardar
          const { currentStatus, ...cleanOrder } = order;

          // Actualizar orden con estado completado y asegurar que el pago esté marcado como completado
          const completedOrder = {
            ...cleanOrder,
            orderStatus: 'completados',
            completedDate: new Date().toISOString(),
            paymentStatus: 'paid',
            paymentMethod: order.paymentMethod === 'pending' ? 'cash' : order.paymentMethod
          };

          await updateOrder(order.id, completedOrder);

          // IMPORTANTE: Limpiar saveOnCloseRef para evitar que sobrescriba el estado completado
          saveOnCloseRef.current = null;

          handleCloseOrderModal();
          showSuccess(`Orden #${order.orderNumber || order.id} entregada exitosamente`);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          // Real-time listener will update the UI automatically
        } catch (error) {
          console.error('Error marking order as delivered:', error);
          showError('Error al marcar la orden como entregada');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      }
    });
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
                onOrderClick={handleOrderClick}
                employees={employees}
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

      {/* Modal para ver detalle de orden */}
      {selectedOrder && (
        <Modal
          isOpen={isOrderModalOpen}
          onClose={handleCloseOrderModal}
          headerContent={headerData ? (
            <div className="order-detail-modal-header">
              <div className="order-header-main">
                <span className="order-header-number">Orden #{headerData.orderNumber}</span>
                <span className="order-header-client">{headerData.client}</span>
                <span className="order-header-date">Recibida {headerData.createdAt}</span>
              </div>
              <div className="order-header-author">
                <select
                  className="order-header-author-select"
                  value={headerData.author}
                  onChange={headerData.onAuthorChange}
                  onClick={(e) => e.stopPropagation()}
                  disabled={headerData.isReadOnly}
                  style={{
                    opacity: headerData.isReadOnly ? 0.6 : 1,
                    cursor: headerData.isReadOnly ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">Sin autor</option>
                  {headerData.activeEmployees?.map(employee => (
                    <option key={employee.id} value={employee.name}>
                      {employee.emoji ? `${employee.emoji} ` : ''}{employee.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : undefined}
          size="large"
        >
          <OrderDetailView
            order={selectedOrder}
            currentTab={selectedOrder.currentStatus}
            onClose={handleCloseOrderModal}
            onSave={handleSaveOrder}
            onCancel={handleCancelOrder}
            onEmail={handleEmail}
            onWhatsApp={handleWhatsApp}
            onEntregar={handleEntregar}
            onBeforeClose={(fn) => { saveOnCloseRef.current = fn; }}
            renderHeader={setHeaderData}
            employees={employees}
          />
        </Modal>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default Clients;
