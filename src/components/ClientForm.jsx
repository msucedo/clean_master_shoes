import { useState, useEffect } from 'react';
import './ClientForm.css';

const ClientForm = ({ onSubmit, onCancel, onDelete, initialData = null }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del cliente es requerido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^[\d-]+$/.test(formData.phone)) {
      newErrors.phone = 'Formato de teléfono inválido';
    }

    // Email is optional, but validate format if provided
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de correo inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevenir múltiples clics
    if (isSubmitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting client:', error);
      // El error ya se maneja en el componente padre
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMenuAction = (action) => {
    setShowMenu(false);

    switch(action) {
      case 'duplicate':
        // TODO: Implementar duplicar cliente
        const duplicateData = {
          ...formData,
          name: formData.name + ' (Copia)'
        };
        onSubmit(duplicateData);
        break;
      case 'delete':
        if (confirm(`¿Estás seguro de eliminar a ${formData.name}?`)) {
          if (onDelete && initialData) {
            onDelete(initialData.id);
          }
          onCancel();
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="client-form">
      {/* Menu Button (only show when editing) */}
      {initialData && (
        <div className="client-menu-container">
          <button
            className="client-menu-button"
            onClick={() => setShowMenu(!showMenu)}
            type="button"
          >
            ⋮
          </button>
          {showMenu && (
            <div className="client-menu-dropdown">
              <button
                className="menu-item menu-duplicate"
                onClick={() => handleMenuAction('duplicate')}
                type="button"
              >
                <span className="menu-icon">📋</span>
                <span className="menu-text">Duplicar Cliente</span>
              </button>
              <button
                className="menu-item menu-delete"
                onClick={() => handleMenuAction('delete')}
                type="button"
              >
                <span className="menu-icon">🗑️</span>
                <span className="menu-text">Eliminar Cliente</span>
              </button>
            </div>
          )}
        </div>
      )}
      <div className="client-form-header">
        <div className="form-icon">👤</div>
        <h2 className="form-title">{initialData ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
        <p className="form-description">
          {initialData ? 'Actualiza la información del cliente' : 'Registra un nuevo cliente en el sistema'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="client-form-content">
        <div className="form-group">
          <label className="form-label">
            Nombre Completo <span className="required">*</span>
          </label>
          <input
            type="text"
            name="name"
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Ej: Juan Pérez González"
            value={formData.name}
            onChange={handleChange}
            autoFocus
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Teléfono <span className="required">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            className={`form-input ${errors.phone ? 'error' : ''}`}
            placeholder="555-123-4567"
            value={formData.phone}
            onChange={handleChange}
          />
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Correo Electrónico <span className="optional">(Opcional)</span>
          </label>
          <input
            type="email"
            name="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="ejemplo@correo.com"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
          <span className="field-hint">Se utilizará para enviar notificaciones por correo</span>
        </div>

        <div className="form-group">
          <label className="form-label">Notas Adicionales</label>
          <textarea
            name="notes"
            className="form-input form-textarea"
            placeholder="Preferencias, alergias, comentarios especiales..."
            rows="4"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{
              opacity: isSubmitting ? 0.6 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting
              ? '⏳ Guardando...'
              : (initialData ? '💾 Guardar Cambios' : '✨ Crear Cliente')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
