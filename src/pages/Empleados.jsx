import { useState, useEffect } from 'react';
import EmpleadoItem from '../components/EmpleadoItem';
import Modal from '../components/Modal';
import EmpleadoForm from '../components/EmpleadoForm';
import PageHeader from '../components/PageHeader';
import {
  subscribeToEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee
} from '../services/firebaseService';
import './Empleados.css';

const Empleados = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } else {
        // Create new employee
        const newEmpleado = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || '',
          role: formData.role,
          hireDate: formData.hireDate,
          salary: formData.salary ? parseFloat(formData.salary) : 0,
          status: formData.status || 'active',
          notes: formData.notes || ''
        };
        await addEmployee(newEmpleado);
      }
      handleCloseModal();
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Error al guardar el empleado');
    }
  };

  const handleDeleteEmpleado = async (empleadoId) => {
    if (confirm('¿Estás seguro de eliminar este empleado?')) {
      try {
        await deleteEmployee(empleadoId);
        handleCloseModal();
        // Real-time listener will update the UI automatically
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Error al eliminar el empleado');
      }
    }
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
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <div className="empty-text">Cargando empleados...</div>
          </div>
        ) : filteredEmpleados.length > 0 ? (
          filteredEmpleados.map((empleado) => (
            <EmpleadoItem
              key={empleado.id}
              empleado={empleado}
              onClick={(emp) => {
                setEditingEmpleado(emp);
                setIsModalOpen(true);
              }}
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
    </div>
  );
};

export default Empleados;
