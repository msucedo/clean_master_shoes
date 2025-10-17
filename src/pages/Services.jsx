import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import ServiceForm from '../components/ServiceForm';
import ServiceCard from '../components/ServiceCard';
import PageHeader from '../components/PageHeader';
import './Services.css';

// Clave para localStorage
const SERVICES_STORAGE_KEY = 'cleanmaster_services';

const Services = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Cargar servicios desde localStorage
  const [services, setServices] = useState(() => {
    const savedServices = localStorage.getItem(SERVICES_STORAGE_KEY);
    return savedServices ? JSON.parse(savedServices) : [];
  });

  // Guardar servicios en localStorage cada vez que cambien
  useEffect(() => {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
  }, [services]);

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

  const handleSubmitService = (formData) => {
    if (selectedService) {
      // Editar servicio existente
      setServices(prev => prev.map(service =>
        service.id === selectedService.id
          ? { ...service, ...formData }
          : service
      ));
    } else {
      // Crear nuevo servicio
      const newService = {
        id: generateServiceId(),
        ...formData,
        stats: {
          thisMonth: 0,
          total: 0
        }
      };
      setServices(prev => [newService, ...prev]);
    }
    handleCloseModal();
  };

  const handleDeleteService = (serviceId) => {
    setServices(prev => prev.filter(service => service.id !== serviceId));
    handleCloseModal();
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
        {filteredServices.length === 0 ? (
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
    </div>
  );
};

export default Services;
