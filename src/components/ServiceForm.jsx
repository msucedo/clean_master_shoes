import { useState, useEffect } from 'react';
import './ServiceForm.css';

const ServiceForm = ({ onSubmit, onCancel, onDelete, initialData = null }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    price: '',
    description: '',
    emoji: '⚙️'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        duration: initialData.duration || '',
        price: initialData.price || '',
        description: initialData.description || '',
        emoji: initialData.emoji || '⚙️'
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

    if (!formData.emoji.trim()) {
      newErrors.emoji = 'El emoji es requerido';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del servicio es requerido';
    }

    if (!formData.duration.trim()) {
      newErrors.duration = 'La duración es requerida';
    }

    // Precio es opcional (puede ser 0 para "precio por definir")
    // Si se proporciona, validar que sea >= 0
    if (formData.price !== '' && formData.price < 0) {
      newErrors.price = 'El precio no puede ser negativo';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const serviceData = {
        ...formData,
        price: formData.price === '' ? 0 : parseFloat(formData.price)
      };
      onSubmit(serviceData);
    }
  };

  const handleMenuAction = (action) => {
    setShowMenu(false);

    switch(action) {
      case 'duplicate':
        const duplicateData = {
          ...formData,
          name: formData.name + ' (Copia)'
        };
        onSubmit(duplicateData);
        break;
      case 'delete':
        if (confirm(`¿Estás seguro de eliminar el servicio "${formData.name}"?`)) {
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
    <div className="service-form">
      {/* Menu Button (only show when editing) */}
      {initialData && (
        <div className="service-menu-container">
          <button
            className="service-menu-button"
            onClick={() => setShowMenu(!showMenu)}
            type="button"
          >
            ⋮
          </button>
          {showMenu && (
            <div className="service-menu-dropdown">
              <button
                className="menu-item menu-duplicate"
                onClick={() => handleMenuAction('duplicate')}
                type="button"
              >
                <span className="menu-icon">📋</span>
                <span className="menu-text">Duplicar Servicio</span>
              </button>
              <button
                className="menu-item menu-delete"
                onClick={() => handleMenuAction('delete')}
                type="button"
              >
                <span className="menu-icon">🗑️</span>
                <span className="menu-text">Eliminar Servicio</span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="service-form-header">
        <div className="form-icon">{formData.emoji}</div>
        <h2 className="form-title">{initialData ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
        <p className="form-description">
          {initialData ? 'Actualiza la información del servicio' : 'Registra un nuevo servicio en el catálogo'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="service-form-content">
        <div className="form-group">
          <label className="form-label">
            Emoji <span className="required">*</span>
          </label>
          <input
            type="text"
            name="emoji"
            className={`form-input ${errors.emoji ? 'error' : ''}`}
            placeholder="Ej: 🧼"
            value={formData.emoji}
            onChange={handleChange}
            maxLength="2"
          />
          {errors.emoji && <span className="error-message">{errors.emoji}</span>}
          <span className="field-hint">Emoji que representa el servicio</span>
        </div>

        <div className="form-group">
          <label className="form-label">
            Nombre del Servicio <span className="required">*</span>
          </label>
          <input
            type="text"
            name="name"
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Ej: Lavado Básico"
            value={formData.name}
            onChange={handleChange}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Duración <span className="required">*</span>
          </label>
          <input
            type="text"
            name="duration"
            className={`form-input ${errors.duration ? 'error' : ''}`}
            placeholder="Ej: 2-3 días"
            value={formData.duration}
            onChange={handleChange}
          />
          {errors.duration && <span className="error-message">{errors.duration}</span>}
          <span className="field-hint">Tiempo estimado para completar el servicio</span>
        </div>

        <div className="form-group">
          <label className="form-label">
            Precio
          </label>
          <input
            type="number"
            name="price"
            className={`form-input ${errors.price ? 'error' : ''}`}
            placeholder="150 (deja en 0 para precio por definir)"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="1"
          />
          {errors.price && <span className="error-message">{errors.price}</span>}
          <span className="field-hint">💡 Usa $0 para servicios con precio variable (se definirá al cobrar)</span>
        </div>

        <div className="form-group">
          <label className="form-label">
            Descripción <span className="required">*</span>
          </label>
          <textarea
            name="description"
            className="form-input form-textarea"
            placeholder="Describe en qué consiste el servicio..."
            rows="4"
            value={formData.description}
            onChange={handleChange}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            {initialData ? '💾 Guardar Cambios' : '✨ Crear Servicio'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;
