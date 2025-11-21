import { useState, useEffect, useMemo } from 'react';
import Modal from '../components/Modal';
import ServiceForm from '../components/ServiceForm';
import ServiceCard from '../components/ServiceCard';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  subscribeToServices,
  subscribeToOrders,
  addService,
  updateService,
  deleteService
} from '../services/firebaseService';
import { useNotification } from '../contexts/NotificationContext';
import { useAdminCheck } from '../contexts/AuthContext';
import './Services.css';

const Services = () => {
  const { showSuccess, showError } = useNotification();
  const isAdmin = useAdminCheck();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState({
    recibidos: [],
    proceso: [],
    listos: [],
    enEntrega: [],
    completados: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'default'
  });

  // Subscribe to real-time services updates
  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToServices((servicesData) => {
      setServices(servicesData);
      setLoading(false);
      setError(null);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Subscribe to real-time orders updates
  useEffect(() => {
    const unsubscribe = subscribeToOrders((ordersData) => {
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  // Calcular estadísticas de servicios basadas en órdenes
  const servicesWithStats = useMemo(() => {
    // Obtener el mes y año actuales
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Combinar todas las órdenes
    const allOrders = [
      ...orders.recibidos,
      ...orders.proceso,
      ...orders.listos,
      ...orders.enEntrega,
      ...orders.completados
    ];

    // Calcular estadísticas para cada servicio
    return services.map(service => {
      let thisMonth = 0;
      let total = 0;

      allOrders.forEach(order => {
        if (order.services && Array.isArray(order.services)) {
          // Contar cuántas veces aparece este servicio en la orden
          const serviceCount = order.services.filter(
            s => s.serviceId === service.id
          ).length;

          if (serviceCount > 0) {
            total += serviceCount;

            // Verificar si la orden es del mes actual
            const orderDate = new Date(order.createdAt);
            const orderMonth = orderDate.getMonth();
            const orderYear = orderDate.getFullYear();

            if (orderMonth === currentMonth && orderYear === currentYear) {
              thisMonth += serviceCount;
            }
          }
        }
      });

      return {
        ...service,
        stats: {
          thisMonth,
          total
        }
      };
    });
  }, [services, orders]);

  const filteredServices = servicesWithStats.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateServiceId = () => {
    if (services.length === 0) return 1;
    const maxId = Math.max(...services.map(s => s.id));
    return maxId + 1;
  };

  const handleAddService = () => {
    // Verificar permisos de admin
    if (!isAdmin) {
      showError('Solo los administradores pueden agregar servicios');
      return;
    }

    setSelectedService(null);
    setIsModalOpen(true);
  };

  const handleEditService = (service) => {
    // Verificar permisos de admin
    if (!isAdmin) {
      showError('Solo los administradores pueden editar servicios');
      return;
    }

    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  const handleSubmitService = async (formData) => {
    try {
      if (selectedService) {
        // Editar servicio existente
        await updateService(selectedService.id, formData);
        showSuccess('Servicio actualizado exitosamente');
      } else {
        // Crear nuevo servicio
        const newService = {
          ...formData,
          stats: {
            thisMonth: 0,
            total: 0
          }
        };
        await addService(newService);
        showSuccess('Servicio creado exitosamente');
      }
      handleCloseModal();
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error saving service:', error);
      showError('Error al guardar el servicio. Por favor intenta de nuevo.');
    }
  };

  const handleDeleteService = (serviceId) => {
    // Verificar permisos de admin
    if (!isAdmin) {
      showError('Solo los administradores pueden eliminar servicios');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Servicio',
      message: '¿Estás seguro de eliminar este servicio?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteService(serviceId);
          handleCloseModal();
          showSuccess('Servicio eliminado exitosamente');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          // Real-time listener will update the UI automatically
        } catch (error) {
          console.error('Error deleting service:', error);
          // Mostrar el mensaje de error específico de la validación
          showError(error.message || 'Error al eliminar el servicio');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      }
    });
  };

  return (
    <div className="services-page">
      {/* Header */}
      <PageHeader
        title="Servicios"
        buttonLabel="Agregar Servicio"
        buttonIcon="➕"
        onButtonClick={handleAddService}
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar servicio..."
      />

      {/* Services Grid */}
      <div className="services-grid">
        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <h3>Cargando servicios...</h3>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h3>Error al cargar servicios</h3>
            <p>{error}</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚙️</div>
            <h3>No hay servicios</h3>
            <p>{searchTerm ? 'No se encontraron servicios' : 'Agrega tu primer servicio al catálogo'}</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={handleEditService}
            />
          ))
        )}
      </div>

      {/* Modal for Service Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedService ? 'Editar Servicio' : 'Nuevo Servicio'}
      >
        <ServiceForm
          onSubmit={handleSubmitService}
          onCancel={handleCloseModal}
          onDelete={handleDeleteService}
          initialData={selectedService}
        />
      </Modal>

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

export default Services;
