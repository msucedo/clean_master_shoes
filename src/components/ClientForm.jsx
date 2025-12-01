import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { ValidatedTextInput, ValidatedPhoneInput, ValidatedEmailInput } from './inputs';
import './ClientForm.css';

const ClientForm = ({ onSubmit, onCancel, onDelete, initialData = null }) => {
  const { showValidationErrors } = useNotification();
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
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevenir múltiples clics
    if (isSubmitting) {
      return;
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      showValidationErrors(validationErrors);
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
        <ValidatedTextInput
          name="name"
          value={formData.name}
          onChange={handleChange}
          label="Nombre Completo"
          placeholder="Ej: Juan Pérez González"
          required={true}
          error={errors.name}
          autoFocus={true}
        />

        <ValidatedPhoneInput
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          label="Teléfono"
          placeholder="5551234567"
          required={true}
          error={errors.phone}
        />

        <ValidatedEmailInput
          name="email"
          value={formData.email}
          onChange={handleChange}
          label="Correo Electrónico"
          placeholder="ejemplo@correo.com"
          required={false}
          error={errors.email}
          hint="Se utilizará para enviar notificaciones por correo"
        />

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
