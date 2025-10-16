import { useState } from 'react';
import ImageUpload from './ImageUpload';
import './ShoePairItem.css'; // Usaremos los mismos estilos

const OtherItem = ({
  item,
  index,
  onUpdate,
  onRemove,
  canRemove,
  services
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [errors, setErrors] = useState({});

  const itemTypes = [
    { value: 'bag', label: '👜 Bolsa', icon: '👜' },
    { value: 'hat', label: '🧢 Gorra', icon: '🧢' },
    { value: 'backpack', label: '🎒 Mochila', icon: '🎒' },
    { value: 'jacket', label: '🧥 Chamarra', icon: '🧥' },
    { value: 'other', label: '📦 Otro', icon: '📦' }
  ];

  const handleChange = (field, value) => {
    onUpdate(item.id, { ...item, [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleServiceChange = (serviceName) => {
    const selectedService = services.find(s => s.name === serviceName);
    onUpdate(item.id, {
      ...item,
      service: serviceName,
      price: selectedService ? selectedService.price : 0
    });
    if (errors.service) {
      setErrors(prev => ({ ...prev, service: '' }));
    }
  };

  const handleImagesChange = (images) => {
    onUpdate(item.id, { ...item, images });
  };

  const getItemTypeLabel = () => {
    const type = itemTypes.find(t => t.value === item.itemType);
    return type ? type.icon : '📦';
  };

  return (
    <div className="shoe-pair-item">
      <div className="pair-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="pair-header-left">
          <span className="pair-number">{getItemTypeLabel()} Item #{index + 1}</span>
          {item.itemType && <span className="pair-model-preview">{itemTypes.find(t => t.value === item.itemType)?.label}</span>}
          {item.description && <span className="pair-model-preview">{item.description}</span>}
          {item.service && <span className="pair-service-preview">{item.service}</span>}
        </div>
        <div className="pair-header-right">
          {item.price > 0 && <span className="pair-price">${item.price}</span>}
          {canRemove && (
            <button
              type="button"
              className="btn-remove-pair"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              title="Eliminar item"
            >
              🗑️
            </button>
          )}
          <button
            type="button"
            className="btn-toggle-pair"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="pair-content">
          <div className="form-group">
            <label className="form-label">
              Tipo de Item <span className="required">*</span>
            </label>
            <div className="service-cards">
              {itemTypes.map((type) => (
                <div
                  key={type.value}
                  className={`service-card-option ${item.itemType === type.value ? 'selected' : ''}`}
                  onClick={() => handleChange('itemType', type.value)}
                  style={{ minHeight: '50px' }}
                >
                  <div className="service-card-header">
                    <span className="service-card-name">{type.label}</span>
                  </div>
                </div>
              ))}
            </div>
            {errors.itemType && <span className="error-message">{errors.itemType}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Descripción <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`form-input ${errors.description ? 'error' : ''}`}
              placeholder="Ej: Bolsa Michael Kors negra, Gorra New Era..."
              value={item.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Servicio <span className="required">*</span>
            </label>
            <div className="service-cards">
              {services.map((service) => (
                <div
                  key={service.name}
                  className={`service-card-option ${item.service === service.name ? 'selected' : ''}`}
                  onClick={() => handleServiceChange(service.name)}
                >
                  <div className="service-card-header">
                    <span className="service-card-name">{service.name}</span>
                    <span className="service-card-price">${service.price}</span>
                  </div>
                  <span className="service-card-duration">⏱️ {service.duration}</span>
                </div>
              ))}
            </div>
            {errors.service && <span className="error-message">{errors.service}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">📸 Fotos del Item</label>
            <ImageUpload images={item.images || []} onChange={handleImagesChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Notas específicas del item</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Detalles específicos de este item: manchas, daños, etc..."
              rows="2"
              value={item.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherItem;
