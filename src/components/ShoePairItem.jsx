import { useState } from 'react';
import ImageUpload from './ImageUpload';
import './ShoePairItem.css';

const ShoePairItem = ({
  pair,
  index,
  onUpdate,
  onRemove,
  canRemove,
  services
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    onUpdate(pair.id, { ...pair, [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleServiceChange = (serviceName) => {
    const selectedService = services.find(s => s.name === serviceName);
    onUpdate(pair.id, {
      ...pair,
      service: serviceName,
      price: selectedService ? selectedService.price : 0
    });
    if (errors.service) {
      setErrors(prev => ({ ...prev, service: '' }));
    }
  };

  const handleImagesChange = (images) => {
    onUpdate(pair.id, { ...pair, images });
  };

  return (
    <div className="shoe-pair-item">
      <div className="pair-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="pair-header-left">
          <span className="pair-number">👟 Par #{index + 1}</span>
          {pair.model && <span className="pair-model-preview">{pair.model}</span>}
          {pair.service && <span className="pair-service-preview">{pair.service}</span>}
        </div>
        <div className="pair-header-right">
          {pair.price > 0 && <span className="pair-price">${pair.price}</span>}
          {canRemove && (
            <button
              type="button"
              className="btn-remove-pair"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(pair.id);
              }}
              title="Eliminar par"
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
              Modelo de Tenis <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`form-input ${errors.model ? 'error' : ''}`}
              placeholder="Ej: Nike Air Max 90, Adidas Superstar..."
              value={pair.model}
              onChange={(e) => handleChange('model', e.target.value)}
            />
            {errors.model && <span className="error-message">{errors.model}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Servicio <span className="required">*</span>
            </label>
            <div className="service-cards">
              {services.map((service) => (
                <div
                  key={service.name}
                  className={`service-card-option ${pair.service === service.name ? 'selected' : ''}`}
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
            <label className="form-label">📸 Fotos del Par</label>
            <ImageUpload images={pair.images || []} onChange={handleImagesChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Notas específicas del par</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Detalles específicos de este par: manchas, daños, etc..."
              rows="2"
              value={pair.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoePairItem;
