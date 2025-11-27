import { useState, useMemo, useEffect, useRef } from 'react';
import ClientItem from '../components/ClientItem';
import ClientItemSkeleton from '../components/ClientItemSkeleton';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';
import OrderDetailView from '../components/OrderDetailView';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import StatCard from '../components/StatCard';
import {
  addClient,
  updateClient,
  deleteClient,
  updateOrder
} from '../services/firebaseService';
import { useOrders } from '../hooks/useOrders';
import { useClients } from '../hooks/useClients';
import { useEmployees } from '../hooks/useEmployees';
import { useNotification } from '../contexts/NotificationContext';
import { useAdminCheck } from '../contexts/AuthContext';
import './Clients.css';

const Clients = () => {
  const { showSuccess, showError, showInfo } = useNotification();
  const isAdmin = useAdminCheck();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('id'); // 'id', 'name', 'orders', 'debt'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc', 'desc'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
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

  // Use React Query hooks for real-time data
  const { data: clients = [], isLoading: clientsLoading, error: clientsError } = useClients();
  const { data: orders = {
    recibidos: [],
    proceso: [],
    listos: [],
    enEntrega: [],
    completados: []
  }, isLoading: ordersLoading } = useOrders({ limitCount: 200 });
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();

  // Combined loading state
  const loading = clientsLoading || ordersLoading || employeesLoading;

  // Handle errors
  useEffect(() => {
    if (clientsError) {
      showError('Error loading clients: ' + clientsError.message);
    }
  }, [clientsError, showError]);

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

  // Crear mapa de números de clientes basado en orden de creación
  const clientNumbers = useMemo(() => {
    const numbersMap = new Map();
    const sortedByCreation = [...clients].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateA - dateB; // Ascendente (más antiguo primero)
    });

    sortedByCreation.forEach((client, index) => {
      numbersMap.set(client.id, index + 1);
    });

    return numbersMap;
  }, [clients]);

  // Calcular estadísticas globales para los StatCards
  const clientStats = useMemo(() => {
    const totalClients = clients.length;
    let activeClients = 0;
    let vipClients = 0;
    let clientsWithDebt = 0;
    let totalDebt = 0;
    let inactiveClients = 0;
    let totalOrders = 0;

    clients.forEach(client => {
      const metrics = clientMetrics.get(client.id);
      if (metrics) {
        if (metrics.isActive) activeClients++;
        if (metrics.isVip) vipClients++;
        if (metrics.debt > 0) {
          clientsWithDebt++;
          totalDebt += metrics.debt;
        }
        if (!metrics.isActive) inactiveClients++;
        totalOrders += metrics.orders;
      }
    });

    // Nuevos este mes (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newThisMonth = clients.filter(client =>
      new Date(client.createdAt) >= thirtyDaysAgo
    ).length;

    // Promedio de órdenes por cliente
    const avgOrdersPerClient = totalClients > 0
      ? (totalOrders / totalClients).toFixed(1)
      : '0';

    return {
      totalClients,
      activeClients,
      vipClients,
      clientsWithDebt,
      totalDebt: Math.round(totalDebt),
      inactiveClients,
      newThisMonth,
      avgOrdersPerClient
    };
  }, [clients, clientMetrics]);

  const filterClients = (clientsList) => {
    let filtered = clientsList;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
      );
    }

    return filtered;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      // Si es el mismo campo, invertir dirección
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Si es campo nuevo, establecer ese campo con dirección ascendente
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleOpenNewClient = () => {
    // Verificar permisos de admin
    if (!isAdmin) {
      showError('Solo los administradores pueden agregar clientes');
      return;
    }

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
    // Verificar permisos de admin
    if (!isAdmin) {
      showError('Solo los administradores pueden eliminar clientes');
      return;
    }

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
          // Mostrar el mensaje de error específico de la validación
          showError(error.message || 'Error al eliminar el cliente');
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

  const filteredClients = useMemo(() => {
    const filtered = filterClients(clients);

    // Aplicar sorting
    return [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'id':
          aValue = clientNumbers.get(a.id) || 0;
          bValue = clientNumbers.get(b.id) || 0;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'orders':
          const aMetrics = clientMetrics.get(a.id);
          const bMetrics = clientMetrics.get(b.id);
          aValue = aMetrics?.orders || 0;
          bValue = bMetrics?.orders || 0;
          break;
        case 'debt':
          const aMetricsDebt = clientMetrics.get(a.id);
          const bMetricsDebt = clientMetrics.get(b.id);
          aValue = aMetricsDebt?.debt || 0;
          bValue = bMetricsDebt?.debt || 0;
          break;
        default:
          return 0;
      }

      // Comparar valores
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [clients, searchTerm, sortBy, sortDirection, clientNumbers, clientMetrics]);

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
      />

      {/* Quick Stats */}
      {!loading && (
        <div className="clients-stats">
          <StatCard
            icon="👥"
            label="Total Clientes"
            value={clientStats.totalClients}
            type="total"
          />
          <StatCard
            icon="✅"
            label="Activos"
            value={clientStats.activeClients}
            type="activos"
          />
          <StatCard
            icon="⭐"
            label="VIP"
            value={clientStats.vipClients}
            type="vip"
          />
          <StatCard
            icon="💳"
            label="Con Deuda"
            value={clientStats.clientsWithDebt}
            type="deuda"
          />
          <StatCard
            icon="💰"
            label="Total Adeudado"
            value={`$${clientStats.totalDebt}`}
            type="ingresos"
          />
          <StatCard
            icon="😴"
            label="Inactivos"
            value={clientStats.inactiveClients}
            type="inactivos"
          />
          <StatCard
            icon="🆕"
            label="Nuevos (30 días)"
            value={clientStats.newThisMonth}
            type="nuevos"
          />
          <StatCard
            icon="📊"
            label="Promedio Órdenes"
            value={clientStats.avgOrdersPerClient}
            type="promedio"
          />
        </div>
      )}

      {/* Table Headers (Sortable) */}
      {!loading && clients.length > 0 && (
        <div className="clients-table-header">
          <div
            className={`header-cell header-number ${sortBy === 'id' ? 'active' : ''}`}
            onClick={() => handleSort('id')}
          >
            #
            {sortBy === 'id' && (
              <span className="sort-indicator">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>
          <div
            className={`header-cell header-name ${sortBy === 'name' ? 'active' : ''}`}
            onClick={() => handleSort('name')}
          >
            Nombre
            {sortBy === 'name' && (
              <span className="sort-indicator">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>
          <div className="header-spacer"></div>
          <div
            className={`header-cell header-orders ${sortBy === 'orders' ? 'active' : ''}`}
            onClick={() => handleSort('orders')}
          >
            Órdenes
            {sortBy === 'orders' && (
              <span className="sort-indicator">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>
          <div
            className={`header-cell header-debt ${sortBy === 'debt' ? 'active' : ''}`}
            onClick={() => handleSort('debt')}
          >
            Deuda
            {sortBy === 'debt' && (
              <span className="sort-indicator">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Clients List */}
      <div className="clients-list">
        {loading ? (
          <>
            <ClientItemSkeleton />
            <ClientItemSkeleton />
            <ClientItemSkeleton />
            <ClientItemSkeleton />
            <ClientItemSkeleton />
            <ClientItemSkeleton />
          </>
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
                clientNumber={clientNumbers.get(client.id)}
                onClick={(client) => {
                  // Verificar permisos de admin
                  if (!isAdmin) {
                    showError('Solo los administradores pueden editar clientes');
                    return;
                  }
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
              {clients.length === 0 && searchTerm === ''
                ? 'Agrega tu primer cliente'
                : 'Intenta ajustar tu búsqueda'}
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
                  value={headerData.authorId || ''}
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
                    <option key={employee.id} value={employee.id}>
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
