import { useState, useEffect } from 'react';
import ClientAutocomplete from './ClientAutocomplete';
import ImageUpload from './ImageUpload';
import './OrderForm.css';

const OrderForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showMenu, setShowMenu] = useState(false);
  const [formData, setFormData] = useState({
    client: '',
    phone: '',
    email: '',
    model: '',
    service: '',
    price: '',
    deliveryDate: '',
    priority: '',
    paymentMethod: 'pending',
    advancePayment: '',
    notes: '',
    images: []
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        client: initialData.client || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        model: initialData.model || '',
        service: initialData.service || '',
        price: initialData.price || '',
        deliveryDate: initialData.deliveryDate?.split(': ')[1] || '',
        priority: initialData.priority || '',
        paymentMethod: initialData.paymentMethod || 'pending',
        advancePayment: initialData.advancePayment || '',
        notes: initialData.notes || '',
        images: initialData.images || []
      });
    }
  }, [initialData]);

  const services = [
    { name: 'Lavado Básico', price: 150, duration: '2-3 días', daysToAdd: 2 },
    { name: 'Lavado Profundo', price: 250, duration: '3-5 días', daysToAdd: 4 },
    { name: 'Lavado Express', price: 100, duration: '1 día', daysToAdd: 1 },
    { name: 'Restauración Completa', price: 400, duration: '5-7 días', daysToAdd: 6 }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleClientInputChange = (e) => {
    setFormData(prev => ({ ...prev, client: e.target.value }));
    if (errors.client) {
      setErrors(prev => ({ ...prev, client: '' }));
    }
  };

  const handleServiceChange = (serviceName) => {
    const selectedService = services.find(s => s.name === serviceName);

    // Calculate delivery date
    let deliveryDate = '';
    if (selectedService && selectedService.daysToAdd) {
      const today = new Date();
      today.setDate(today.getDate() + selectedService.daysToAdd);
      deliveryDate = today.toISOString().split('T')[0];
    }

    setFormData(prev => ({
      ...prev,
      service: serviceName,
      price: selectedService ? selectedService.price : '',
      deliveryDate: deliveryDate
    }));
    if (errors.service) {
      setErrors(prev => ({ ...prev, service: '' }));
    }
  };

  const handleSelectClient = (client) => {
    setFormData(prev => ({
      ...prev,
      client: client.name,
      phone: client.phone,
      email: client.email || ''
    }));
    setErrors(prev => ({ ...prev, client: '', phone: '' }));
  };

  const handleImagesChange = (images) => {
    setFormData(prev => ({ ...prev, images }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.client.trim()) {
        newErrors.client = 'El nombre del cliente es requerido';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'El teléfono es requerido';
      } else if (!/^[\d-]+$/.test(formData.phone)) {
        newErrors.phone = 'Formato de teléfono inválido';
      }
    } else if (step === 2) {
      if (!formData.model.trim()) {
        newErrors.model = 'El modelo de tenis es requerido';
      }
      if (!formData.service) {
        newErrors.service = 'Selecciona un servicio';
      }
    } else if (step === 3) {
      if (!formData.deliveryDate) {
        newErrors.deliveryDate = 'La fecha de entrega es requerida';
      }
      if (formData.advancePayment && parseFloat(formData.advancePayment) > parseFloat(formData.price)) {
        newErrors.advancePayment = 'El anticipo no puede ser mayor al precio total';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      onSubmit(formData);
    }
  };

  const handleMenuAction = (action) => {
    setShowMenu(false);

    switch(action) {
      case 'invoice':
        // TODO: Implementar generación de factura
        alert('Generar factura para ' + formData.client);
        break;
      case 'email':
        // TODO: Implementar envío de correo basado en etapa de la orden
        // La funcionalidad completa seleccionará la plantilla según la etapa
        alert('Enviar correo a ' + formData.client + '\nSe seleccionará la plantilla según la etapa de la orden');
        break;
      case 'contact':
        // TODO: Implementar contacto con cliente
        const phone = formData.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}`, '_blank');
        break;
      case 'delete':
        // TODO: Implementar eliminación de orden
        if (confirm('¿Estás seguro de eliminar esta orden?')) {
          alert('Orden eliminada');
          onCancel();
        }
        break;
      default:
        break;
    }
  };

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <div className="step-icon-large">👤</div>
            <h3 className="step-title-large">Información del Cliente</h3>
            <p className="step-description">Busca un cliente existente o crea uno nuevo</p>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Cliente <span className="required">*</span>
                </label>
                <ClientAutocomplete
                  value={formData.client}
                  onChange={handleClientInputChange}
                  onSelectClient={handleSelectClient}
                  error={errors.client}
                />
                {errors.client && <span className="error-message">{errors.client}</span>}
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
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="step-icon-large">👟</div>
            <h3 className="step-title-large">Servicio y Fotos</h3>
            <p className="step-description">Selecciona el servicio y sube fotos de los tenis</p>

            {/* Show photos first when editing */}
            {initialData && (
              <div className="form-section">
                <label className="form-label">📸 Fotos de los Tenis</label>
                <ImageUpload images={formData.images} onChange={handleImagesChange} />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Modelo de Tenis <span className="required">*</span>
              </label>
              <input
                type="text"
                name="model"
                className={`form-input ${errors.model ? 'error' : ''}`}
                placeholder="Ej: Nike Air Max 90, Adidas Superstar..."
                value={formData.model}
                onChange={handleChange}
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
                    className={`service-card-option ${formData.service === service.name ? 'selected' : ''}`}
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

            {/* Show photos last when creating new order */}
            {!initialData && (
              <div className="form-section">
                <label className="form-label">📸 Fotos de los Tenis</label>
                <ImageUpload images={formData.images} onChange={handleImagesChange} />
              </div>
            )}
          </div>
        );
        case 3:
        return (
          <div className="step-content">
            <div className="step-icon-large">💰</div>
            <h3 className="step-title-large">Pago y Entrega</h3>
            <p className="step-description">Define el método de pago y fecha de entrega</p>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Fecha de Entrega <span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  className={`form-input ${errors.deliveryDate ? 'error' : ''}`}
                  value={formData.deliveryDate}
                  onChange={handleChange}
                />
                {errors.deliveryDate && <span className="error-message">{errors.deliveryDate}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Prioridad</label>
                <select
                  name="priority"
                  className="form-input"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="">Normal</option>
                  <option value="high">Alta 🔥</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Método de Pago</label>
              <div className="payment-methods">
                <div
                  className={`payment-method ${formData.paymentMethod === 'cash' ? 'selected' : ''}`}
                  onClick={() => handleChange({ target: { name: 'paymentMethod', value: 'cash' } })}
                >
                  <span className="payment-icon">💵</span>
                  <span className="payment-label">Efectivo</span>
                </div>
                <div
                  className={`payment-method ${formData.paymentMethod === 'card' ? 'selected' : ''}`}
                  onClick={() => handleChange({ target: { name: 'paymentMethod', value: 'card' } })}
                >
                  <span className="payment-icon">💳</span>
                  <span className="payment-label">Tarjeta</span>
                </div>
                <div
                  className={`payment-method ${formData.paymentMethod === 'transfer' ? 'selected' : ''}`}
                  onClick={() => handleChange({ target: { name: 'paymentMethod', value: 'transfer' } })}
                >
                  <span className="payment-icon">📱</span>
                  <span className="payment-label">Transferencia</span>
                </div>
                <div
                  className={`payment-method ${formData.paymentMethod === 'pending' ? 'selected' : ''}`}
                  onClick={() => handleChange({ target: { name: 'paymentMethod', value: 'pending' } })}
                >
                  <span className="payment-icon">⏳</span>
                  <span className="payment-label">Pendiente</span>
                </div>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Anticipo (Opcional)</label>
                <input
                  type="number"
                  name="advancePayment"
                  className={`form-input ${errors.advancePayment ? 'error' : ''}`}
                  placeholder="0"
                  value={formData.advancePayment}
                  onChange={handleChange}
                />
                {errors.advancePayment && <span className="error-message">{errors.advancePayment}</span>}
                {formData.advancePayment && formData.price && (
                  <div className="payment-info">
                    <span>Restante: ${parseFloat(formData.price || 0) - parseFloat(formData.advancePayment || 0)}</span>
                  </div>
                )}
              </div>

              <div className="form-group full-width">
                <label className="form-label">Notas adicionales</label>
                <textarea
                  name="notes"
                  className="form-input form-textarea"
                  placeholder="Cualquier detalle importante sobre el servicio..."
                  rows="3"
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <div className="step-icon-large">✅</div>
            <h3 className="step-title-large">Resumen de la Orden</h3>
            <p className="step-description">Verifica que toda la información sea correcta</p>

            <div className="summary-card">
              <div className="summary-section">
                <h4 className="summary-section-title">👤 Cliente</h4>
                <div className="summary-row">
                  <span className="summary-label">Nombre:</span>
                  <span className="summary-value">{formData.client || '-'}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Teléfono:</span>
                  <span className="summary-value">{formData.phone || '-'}</span>
                </div>
              </div>

              <div className="summary-section">
                <h4 className="summary-section-title">👟 Servicio</h4>
                <div className="summary-row">
                  <span className="summary-label">Modelo:</span>
                  <span className="summary-value">{formData.model || '-'}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Servicio:</span>
                  <span className="summary-value">{formData.service || '-'}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Fotos:</span>
                  <span className="summary-value">{formData.images.length} imagen{formData.images.length !== 1 ? 'es' : ''}</span>
                </div>
              </div>

              <div className="summary-section">
                <h4 className="summary-section-title">💰 Pago</h4>
                <div className="summary-row">
                  <span className="summary-label">Precio Total:</span>
                  <span className="summary-value price-highlight">${formData.price || '0'}</span>
                </div>
                {formData.advancePayment && (
                  <>
                    <div className="summary-row">
                      <span className="summary-label">Anticipo:</span>
                      <span className="summary-value">${formData.advancePayment}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Restante:</span>
                      <span className="summary-value">${parseFloat(formData.price || 0) - parseFloat(formData.advancePayment || 0)}</span>
                    </div>
                  </>
                )}
                <div className="summary-row">
                  <span className="summary-label">Método:</span>
                  <span className="summary-value">
                    {formData.paymentMethod === 'cash' && '💵 Efectivo'}
                    {formData.paymentMethod === 'card' && '💳 Tarjeta'}
                    {formData.paymentMethod === 'transfer' && '📱 Transferencia'}
                    {formData.paymentMethod === 'pending' && '⏳ Pendiente'}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Entrega:</span>
                  <span className="summary-value">{formData.deliveryDate || '-'}</span>
                </div>
                {formData.priority && (
                  <div className="summary-row">
                    <span className="summary-label">Prioridad:</span>
                    <span className="summary-value priority-high">🔥 Alta</span>
                  </div>
                )}
              </div>

              {formData.notes && (
                <div className="summary-section">
                  <h4 className="summary-section-title">📝 Notas</h4>
                  <p className="summary-notes">{formData.notes}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };
  return (
    <div className="order-form">
      {/* Menu Button (only show when editing) */}
      {initialData && (
        <div className="order-menu-container">
          <button
            className="order-menu-button"
            onClick={() => setShowMenu(!showMenu)}
            type="button"
          >
            ⋮
          </button>
          {showMenu && (
            <div className="order-menu-dropdown">
              <button
                className="menu-item menu-invoice"
                onClick={() => handleMenuAction('invoice')}
                type="button"
              >
                <span className="menu-icon">🧾</span>
                <span className="menu-text">Generar Factura</span>
              </button>
              <button
                className="menu-item menu-email"
                onClick={() => handleMenuAction('email')}
                type="button"
              >
                <span className="menu-icon">📧</span>
                <span className="menu-text">Enviar Correo</span>
              </button>
              <button
                className="menu-item menu-contact"
                onClick={() => handleMenuAction('contact')}
                type="button"
              >
                <span className="menu-icon">💬</span>
                <span className="menu-text">Contactar WhatsApp</span>
              </button>
              <button
                className="menu-item menu-delete"
                onClick={() => handleMenuAction('delete')}
                type="button"
              >
                <span className="menu-icon">🗑️</span>
                <span className="menu-text">Eliminar Orden</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar with Gradient */}
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Steps Indicator */}
      <div className="steps-indicator">
        <div className={`step-item ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">{currentStep > 1 ? '✓' : '1'}</div>
          <div className="step-label">Cliente</div>
        </div>
        <div className="step-line"></div>
        <div className={`step-item ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">{currentStep > 2 ? '✓' : '2'}</div>
          <div className="step-label">Servicio</div>
        </div>
        <div className="step-line"></div>
        <div className={`step-item ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
          <div className="step-number">{currentStep > 3 ? '✓' : '3'}</div>
          <div className="step-label">Pago</div>
        </div>
        <div className="step-line"></div>
        <div className={`step-item ${currentStep >= 4 ? 'active' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">Resumen</div>
        </div>
      </div>

      {/* Step Content with Animation */}
      <div className="step-container">
        {renderStepContent()}
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <div className="left-actions">
          {currentStep > 1 ? (
            <button type="button" className="btn-secondary" onClick={handlePrevious}>
              ← Anterior
            </button>
          ) : (
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>
        <div className="right-actions">
          {currentStep < 4 ? (
            <button type="button" className="btn-primary" onClick={handleNext}>
              Siguiente →
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={handleSubmit}>
              {initialData ? '💾 Guardar Cambios' : '✨ Crear Orden'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderForm;