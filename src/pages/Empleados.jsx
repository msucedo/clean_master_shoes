import { useState, useEffect, useRef } from 'react';
import EmpleadoItem from '../components/EmpleadoItem';
import EmpleadoItemSkeleton from '../components/EmpleadoItemSkeleton';
import Modal from '../components/Modal';
import EmpleadoForm from '../components/EmpleadoForm';
import OrderDetailView from '../components/OrderDetailView';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  subscribeToEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  updateOrder
} from '../services/firebaseService';
import { useNotification } from '../contexts/NotificationContext';
import { useAdminCheck } from '../contexts/AuthContext';
import './Empleados.css';

const Empleados = () => {
  const { showSuccess, showError, showInfo } = useNotification();
  const isAdmin = useAdminCheck();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Subscribe to real-time employees updates
  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToEmployees((empleadosData) => {
      setEmpleados(empleadosData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filterEmpleados = (empleadosList) => {
    let filtered = empleadosList;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(empleado =>
        empleado.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empleado.phone.includes(searchTerm) ||
        (empleado.role && empleado.role.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (activeFilter === 'active') {
      filtered = filtered.filter(empleado => empleado.status === 'active');
    } else if (activeFilter === 'inactive') {
      filtered = filtered.filter(empleado => empleado.status === 'inactive');
    }

    return filtered;
  };

  const handleOpenNewEmpleado = () => {
    // Verificar permisos de admin
    if (!isAdmin) {
      showError('Solo los administradores pueden agregar empleados');
      return;
    }

    setEditingEmpleado(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmpleado(null);
  };

  const handleSubmitEmpleado = async (formData) => {
    try {
      if (editingEmpleado) {
        // Edit existing employee
        await updateEmployee(editingEmpleado.id, formData);
        showSuccess('Empleado actualizado exitosamente');
      } else {
        // Create new employee
        const newEmpleado = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || '',
          role: formData.role,
          hireDate: formData.hireDate,
          status: formData.status || 'active',
          notes: formData.notes || '',
          emoji: formData.emoji || ''
        };
        await addEmployee(newEmpleado);
        showSuccess('Empleado agregado exitosamente');
      }
      handleCloseModal();
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error saving employee:', error);
      showError('Error al guardar el empleado. Por favor intenta de nuevo.');
    }
  };

  const handleDeleteEmpleado = (empleadoId) => {
    // Verificar permisos de admin
    if (!isAdmin) {
      showError('Solo los administradores pueden eliminar empleados');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Empleado',
      message: '¿Estás seguro de eliminar este empleado?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteEmployee(empleadoId);
          handleCloseModal();
          showSuccess('Empleado eliminado exitosamente');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          // Real-time listener will update the UI automatically
        } catch (error) {
          console.error('Error deleting employee:', error);
          // Mostrar el mensaje de error específico del backend
          showError(error.message || 'Error al eliminar el empleado');
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
    console.log('🚪 [EMPLEADOS] Cerrando modal de orden', {
      hasSaveOnClose: !!saveOnCloseRef.current
    });

    // Ejecutar guardado si existe (solo guarda si hay cambios)
    if (saveOnCloseRef.current) {
      console.log('💾 [EMPLEADOS] Ejecutando saveOnClose...');
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
    // Verificar permisos de admin
    if (!isAdmin) {
      showError('Solo los administradores pueden cancelar órdenes');
      return;
    }

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

  const filteredEmpleados = filterEmpleados(empleados);

  return (
    <div className="empleados-page">
      {/* Header */}
      <PageHeader
        title="Empleados"
        buttonLabel="Agregar Empleado"
        buttonIcon="➕"
        onButtonClick={handleOpenNewEmpleado}
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar empleado por nombre, teléfono o rol..."
        filters={[
          {
            label: 'Todos',
            onClick: () => setActiveFilter('all'),
            active: activeFilter === 'all'
          },
          {
            label: 'Activos',
            onClick: () => setActiveFilter('active'),
            active: activeFilter === 'active'
          },
          {
            label: 'Inactivos',
            onClick: () => setActiveFilter('inactive'),
            active: activeFilter === 'inactive'
          }
        ]}
      />

      {/* Empleados List */}
      <div className="empleados-list">
        {loading ? (
          <>
            <EmpleadoItemSkeleton />
            <EmpleadoItemSkeleton />
            <EmpleadoItemSkeleton />
            <EmpleadoItemSkeleton />
            <EmpleadoItemSkeleton />
          </>
        ) : filteredEmpleados.length > 0 ? (
          filteredEmpleados.map((empleado) => (
            <EmpleadoItem
              key={empleado.id}
              empleado={empleado}
              onClick={(emp) => {
                // Verificar permisos de admin
                if (!isAdmin) {
                  showError('Solo los administradores pueden editar empleados');
                  return;
                }
                setEditingEmpleado(emp);
                setIsModalOpen(true);
              }}
              onOrderClick={handleOrderClick}
              showSuccess={showSuccess}
              showError={showError}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">😕</div>
            <div className="empty-text">No se encontraron empleados</div>
            <div className="empty-subtext">
              {empleados.length === 0 && searchTerm === '' && activeFilter === 'all'
                ? 'Agrega tu primer empleado'
                : 'Intenta ajustar tus filtros o búsqueda'}
            </div>
          </div>
        )}
      </div>

      {/* Modal for New/Edit Empleado */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
        size="medium"
      >
        <EmpleadoForm
          onSubmit={handleSubmitEmpleado}
          onCancel={handleCloseModal}
          onDelete={handleDeleteEmpleado}
          initialData={editingEmpleado}
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
            employees={empleados}
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

export default Empleados;
