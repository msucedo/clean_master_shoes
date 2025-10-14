import { useState } from 'react';
import ServiceCard from '../components/ServiceCard';
import PageHeader from '../components/PageHeader';
import { mockServices } from '../data/mockData';
import './Services.css';

const Services = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const services = [
    {
      id: 1,
      name: 'Lavado Básico',
      duration: '2-3 días',
      price: 150,
      description: 'Limpieza superficial de tenis, ideal para mantenimiento regular. Incluye limpieza de suela, lateral y lengüeta.',
      stats: {
        thisMonth: 47,
        total: 156
      }
    },
    {
      id: 2,
      name: 'Lavado Profundo',
      duration: '3-5 días',
      price: 250,
      description: 'Limpieza profunda con productos especializados. Incluye tratamiento de manchas difíciles y desinfección completa.',
      stats: {
        thisMonth: 32,
        total: 98
      }
    },
    {
      id: 3,
      name: 'Restauración',
      duration: '5-7 días',
      price: 400,
      description: 'Restauración completa de tenis viejos o muy dañados. Incluye reparación de daños, repintado y protección.',
      stats: {
        thisMonth: 12,
        total: 45
      }
    },
    {
      id: 4,
      name: 'Lavado Express',
      duration: '1 día',
      price: 100,
      description: 'Servicio rápido para limpieza básica urgente. Ideal para eventos o necesidades inmediatas.',
      stats: {
        thisMonth: 24,
        total: 67
      }
    }
  ];

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddService = () => {
    console.log('Add new service');
    // Here you would open add service modal
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
        {filteredServices.map((service) => (
          <ServiceCard key={service.id} {...service} />
        ))}
      </div>
    </div>
  );
};

export default Services;
