import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './VariablePriceModal.css';

const VariablePriceModal = ({ services, onConfirm, onCancel }) => {
  // Inicializar precios en 0 para servicios sin precio
  const [prices, setPrices] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const initialPrices = {};
    services.forEach(service => {
      initialPrices[service.id] = '';
    });
    setPrices(initialPrices);
  }, [services]);

  const handlePriceChange = (serviceId, value) => {
    setPrices(prev => ({
      ...prev,
      [serviceId]: value
    }));

    // Limpiar error al cambiar valor
    if (errors[serviceId]) {
      setErrors(prev => ({
        ...prev,
        [serviceId]: null
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    let isValid = true;

    services.forEach(service => {
      const price = parseFloat(prices[service.id]);

      if (!prices[service.id] || prices[service.id].trim() === '') {
        newErrors[service.id] = 'Debe asignar un precio';
        isValid = false;
      } else if (isNaN(price) || price <= 0) {
        newErrors[service.id] = 'El precio debe ser mayor a $0';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleConfirm = () => {
    if (!validate()) {
      return;
    }

    // Crear objeto con los precios asignados
    const assignedPrices = {};
    services.forEach(service => {
      assignedPrices[service.id] = parseFloat(prices[service.id]);
    });

    onConfirm(assignedPrices);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  return (
    <div className="variable-price-modal-overlay">
      <div className="variable-price-modal">
        <div className="vpm-header">
          <h2>⚠️ Definir Precios de Servicios</h2>
          <p className="vpm-subtitle">
            Los siguientes servicios no tienen precio definido. Por favor asigna un precio para continuar.
          </p>
        </div>

        <div className="vpm-services-list">
          {services.map(service => (
            <div key={service.id} className="vpm-service-item">
              <div className="vpm-service-info">
                <div className="vpm-service-icon">{service.icon}</div>
                <div className="vpm-service-details">
                  <div className="vpm-service-name">{service.serviceName}</div>
                  <div className="vpm-service-note">Precio por definir</div>
                </div>
              </div>

              <div className="vpm-price-input-wrapper">
                <label className="vpm-label">Precio *</label>
                <div className="vpm-input-group">
                  <span className="vpm-currency">$</span>
                  <input
                    type="number"
                    className={`vpm-price-input ${errors[service.id] ? 'error' : ''}`}
                    value={prices[service.id] || ''}
                    onChange={(e) => handlePriceChange(service.id, e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    autoFocus={service.id === services[0].id}
                  />
                </div>
                {errors[service.id] && (
                  <span className="vpm-error">{errors[service.id]}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="vpm-total">
          <span>Total a agregar:</span>
          <span className="vpm-total-amount">
            {formatCurrency(
              Object.values(prices).reduce((sum, price) => {
                const p = parseFloat(price);
                return sum + (isNaN(p) ? 0 : p);
              }, 0)
            )}
          </span>
        </div>

        <div className="vpm-actions">
          <button
            type="button"
            className="vpm-btn-cancel"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="vpm-btn-confirm"
            onClick={handleConfirm}
          >
            Confirmar Precios
          </button>
        </div>
      </div>
    </div>
  );
};

VariablePriceModal.propTypes = {
  services: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      serviceName: PropTypes.string.isRequired,
      icon: PropTypes.string,
      price: PropTypes.number
    })
  ).isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default VariablePriceModal;
