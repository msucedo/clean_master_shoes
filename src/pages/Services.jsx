import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import ServiceForm from '../components/ServiceForm';
import ServiceCard from '../components/ServiceCard';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  subscribeToServices,
  addService,
  updateService,
  deleteService
} from '../services/firebaseService';
import { useNotification } from '../contexts/NotificationContext';
import './Services.css';

const Services = () => {
  const { showSuccess, showError } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [services, setServices] = useState([]);
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

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateServiceId = () => {
    if (services.length === 0) return 1;
    const maxId = Math.max(...services.map(s => s.id));
    return maxId + 1;
  };

  const handleAddService = () => {
    setSelectedService(null);
    setIsModalOpen(true);
  };

  const handleEditService = (service) => {
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
          showError('Error al eliminar el servicio');
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
