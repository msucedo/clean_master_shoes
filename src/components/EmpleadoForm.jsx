import { useState, useEffect } from 'react';
import { useAdminCheck } from '../contexts/AuthContext';
import './EmpleadoForm.css';

const EmpleadoForm = ({ onSubmit, onCancel, onDelete, initialData }) => {
  const isCurrentUserAdmin = useAdminCheck();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: '',
    hireDate: '',
    status: 'active',
    notes: '',
    emoji: '',
    isAdmin: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        role: initialData.role || '',
        hireDate: initialData.hireDate || '',
        status: initialData.status || 'active',
        notes: initialData.notes || '',
        emoji: initialData.emoji || '',
        isAdmin: initialData.isAdmin || false
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'El teléfono debe tener 10 dígitos';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@gmail\.com$/.test(formData.email)) {
      newErrors.email = 'Debe ser un correo de Gmail (@gmail.com)';
    }

    if (!formData.role.trim()) {
      newErrors.role = 'El rol es requerido';
    }

    if (!formData.hireDate) {
      newErrors.hireDate = 'La fecha de contratación es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleDelete = () => {
    if (initialData && initialData.id) {
      onDelete(initialData.id);
    }
  };

  return (
    <form className="empleado-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="name">Nombre Completo *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? 'error' : ''}
            placeholder="Juan Pérez"
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="phone">Teléfono *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={errors.phone ? 'error' : ''}
            placeholder="1234567890"
          />
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email (Gmail) *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'error' : ''}
            placeholder="empleado@gmail.com"
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="role">Rol/Puesto *</label>
          <input
            type="text"
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={errors.role ? 'error' : ''}
            placeholder="Ej: Técnico, Vendedor, Gerente"
          />
          {errors.role && <span className="error-message">{errors.role}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="hireDate">Fecha de Contratación *</label>
          <input
            type="date"
            id="hireDate"
            name="hireDate"
            value={formData.hireDate}
            onChange={handleChange}
            className={errors.hireDate ? 'error' : ''}
          />
          {errors.hireDate && <span className="error-message">{errors.hireDate}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="status">Estado *</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>

        {/* Campo Administrador - Solo visible para admins */}
        {isCurrentUserAdmin && (
          <div className="form-group">
            <label htmlFor="isAdmin" className="checkbox-label">
              <input
                type="checkbox"
                id="isAdmin"
                name="isAdmin"
                checked={formData.isAdmin}
                onChange={(e) => setFormData(prev => ({ ...prev, isAdmin: e.target.checked }))}
              />
              <span className="checkbox-text">
                👑 Administrador
              </span>
            </label>
            <span className="field-hint">
              Los administradores pueden eliminar, cancelar órdenes y agregar servicios/inventario
            </span>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="emoji">Emoji (opcional)</label>
          <input
            type="text"
            id="emoji"
            name="emoji"
            value={formData.emoji}
            onChange={handleChange}
            placeholder="👨‍💼"
            maxLength="4"
          />
          <span className="field-hint">Pega o escribe un emoji para representar al empleado</span>
        </div>

        <div className="form-group full-width">
          <label htmlFor="notes">Notas (opcional)</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Información adicional sobre el empleado..."
            rows="4"
          />
        </div>
      </div>

      <div className="form-actions">
        <div className="form-actions-left">
          {initialData && isCurrentUserAdmin && (
            <button
              type="button"
              className="btn-delete"
              onClick={handleDelete}
            >
              Eliminar
            </button>
          )}
        </div>
        <div className="form-actions-right">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn-submit">
            {initialData ? 'Guardar Cambios' : 'Agregar Empleado'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default EmpleadoForm;
