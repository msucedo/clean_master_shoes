import { useState, useEffect } from 'react';
import ClientAutocomplete from './ClientAutocomplete';
import ShoePairItem from './ShoePairItem';
import OtherItem from './OtherItem';
import './OrderForm.css';

// Función para generar IDs únicos
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const OrderForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showMenu, setShowMenu] = useState(false);

  // Nueva estructura de datos con múltiples pares y otros items
  const [formData, setFormData] = useState({
    client: '',
    phone: '',
    email: '',
    shoePairs: [
      {
        id: generateId(),
        model: '',
        service: '',
        price: 0,
        images: [],
        notes: ''
      }
    ],
    otherItems: [], // Nueva propiedad para otros items
    deliveryDate: '',
    priority: '',
    paymentMethod: 'pending',
    advancePayment: '',
    generalNotes: ''
  });

  const [errors, setErrors] = useState({});

  // Cargar servicios desde localStorage
  const [services, setServices] = useState(() => {
    const savedServices = localStorage.getItem('cleanmaster_services');
    if (savedServices) {
      const parsedServices = JSON.parse(savedServices);
      // Agregar daysToAdd automáticamente basado en la duración
      return parsedServices.map(service => {
        // Extraer números de la duración (ej: "2-3 días" -> 3, "1 día" -> 1)
        const durationMatch = service.duration.match(/(\d+)(?:-(\d+))?/);
        const daysToAdd = durationMatch ? parseInt(durationMatch[2] || durationMatch[1]) : 2;
        return {
          ...service,
          daysToAdd
        };
      });
    }
    return [];
  });

  // Calcular precio total de todos los pares y otros items
  const calculateTotalPrice = () => {
    const shoesTotal = formData.shoePairs.reduce((total, pair) => total + (pair.price || 0), 0);
    const otherItemsTotal = formData.otherItems.reduce((total, item) => total + (item.price || 0), 0);
    return shoesTotal + otherItemsTotal;
  };

  // Cargar datos iniciales (para editar órdenes existentes)
  useEffect(() => {
    if (initialData) {
      // Convertir datos antiguos al nuevo formato
      if (initialData.model && initialData.service) {
        // Formato antiguo - convertir a array de pares
        setFormData({
          client: initialData.client || '',
          phone: initialData.phone || '',
          email: initialData.email || '',
          shoePairs: [{
            id: generateId(),
            model: initialData.model || '',
            service: initialData.service || '',
            price: initialData.price || 0,
            images: initialData.images || [],
            notes: ''
          }],
          deliveryDate: initialData.deliveryDate?.split(': ')[1] || '',
          priority: initialData.priority || '',
          paymentMethod: initialData.paymentMethod || 'pending',
          advancePayment: initialData.advancePayment || '',
          generalNotes: initialData.notes || ''
        });
      } else if (initialData.shoePairs) {
        // Formato nuevo - usar directamente
        setFormData({
          ...initialData,
          shoePairs: initialData.shoePairs.map(pair => ({
            ...pair,
            id: pair.id || generateId()
          }))
        });
      }
    }
  }, [initialData]);

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

  const handleSelectClient = (client) => {
    setFormData(prev => ({
      ...prev,
      client: client.name,
      phone: client.phone,
      email: client.email || ''
    }));
    setErrors(prev => ({ ...prev, client: '', phone: '' }));
  };

  // Agregar un nuevo par de tenis
  const handleAddPair = () => {
    setFormData(prev => ({
      ...prev,
      shoePairs: [
        ...prev.shoePairs,
        {
          id: generateId(),
          model: '',
          service: '',
          price: 0,
          images: [],
          notes: ''
        }
      ]
    }));
  };

  // Eliminar un par de tenis
  const handleRemovePair = (pairId) => {
    if (formData.shoePairs.length === 1) {
      alert('Debe haber al menos un par de tenis en la orden');
      return;
    }
    setFormData(prev => ({
      ...prev,
      shoePairs: prev.shoePairs.filter(pair => pair.id !== pairId)
    }));
  };

  // Actualizar un par de tenis
  const handleUpdatePair = (pairId, updatedPair) => {
    setFormData(prev => ({
      ...prev,
      shoePairs: prev.shoePairs.map(pair =>
        pair.id === pairId ? updatedPair : pair
      )
    }));
  };

  // Agregar un nuevo item (bolsa, gorra, etc)
  const handleAddOtherItem = () => {
    setFormData(prev => ({
      ...prev,
      otherItems: [
        ...prev.otherItems,
        {
          id: generateId(),
          itemType: '',
          description: '',
          service: '',
          price: 0,
          images: [],
          notes: ''
        }
      ]
    }));
  };

  // Eliminar un item
  const handleRemoveOtherItem = (itemId) => {
    setFormData(prev => ({
      ...prev,
      otherItems: prev.otherItems.filter(item => item.id !== itemId)
    }));
  };

  // Actualizar un item
  const handleUpdateOtherItem = (itemId, updatedItem) => {
    setFormData(prev => ({
      ...prev,
      otherItems: prev.otherItems.map(item =>
        item.id === itemId ? updatedItem : item
      )
    }));
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
      // Validar que haya al menos un par
      if (formData.shoePairs.length === 0) {
        newErrors.shoePairs = 'Debe agregar al menos un par de tenis';
      }
      // Validar cada par
      formData.shoePairs.forEach((pair, index) => {
        if (!pair.model.trim()) {
          newErrors[`pair_${index}_model`] = 'El modelo es requerido';
        }
        if (!pair.service) {
          newErrors[`pair_${index}_service`] = 'El servicio es requerido';
        }
      });
    } else if (step === 3) {
      if (!formData.deliveryDate) {
        newErrors.deliveryDate = 'La fecha de entrega es requerida';
      }
      const totalPrice = calculateTotalPrice();
      if (formData.advancePayment && parseFloat(formData.advancePayment) > totalPrice) {
        newErrors.advancePayment = 'El anticipo no puede ser mayor al precio total';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Auto-calcular fecha de entrega basada en el servicio más largo
      if (currentStep === 2 && !formData.deliveryDate) {
        const maxDays = Math.max(
          ...formData.shoePairs
            .map(pair => {
              const service = services.find(s => s.name === pair.service);
              return service?.daysToAdd || 0;
            })
        );

        if (maxDays > 0) {
          const today = new Date();
          today.setDate(today.getDate() + maxDays);
          setFormData(prev => ({
            ...prev,
            deliveryDate: today.toISOString().split('T')[0]
          }));
        }
      }

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
      // Agregar el precio total calculado
      const orderData = {
        ...formData,
        totalPrice: calculateTotalPrice()
      };
      onSubmit(orderData);
    }
  };

  const handleMenuAction = (action) => {
    setShowMenu(false);

    switch(action) {
      case 'invoice':
        alert('Generar factura para ' + formData.client);
        break;
      case 'email':
        alert('Enviar correo a ' + formData.client + '\nSe seleccionará la plantilla según la etapa de la orden');
        break;
      case 'contact':
        const phone = formData.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}`, '_blank');
        break;
      case 'delete':
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
            <h3 className="step-title-large">Pares de Tenis</h3>
            <p className="step-description">Agrega todos los Pares de Tenis del cliente u otros items (bolsas, gorras, etc.)</p>

            <div className="shoe-pairs-container">
              {/* Pares de Tenis */}
              {formData.shoePairs.map((pair, index) => (
                <ShoePairItem
                  key={pair.id}
                  pair={pair}
                  index={index}
                  onUpdate={handleUpdatePair}
                  onRemove={handleRemovePair}
                  canRemove={formData.shoePairs.length > 1}
                  services={services}
                />
              ))}

              <button
                type="button"
                className="btn-add-pair"
                onClick={handleAddPair}
              >
                <span className="btn-add-icon">➕</span>
                <span>Agregar otro par de tenis</span>
              </button>

              {/* Otros Items */}
              {formData.otherItems.map((item, index) => (
                <OtherItem
                  key={item.id}
                  item={item}
                  index={index}
                  onUpdate={handleUpdateOtherItem}
                  onRemove={handleRemoveOtherItem}
                  canRemove={true}
                  services={services}
                />
              ))}

              <button
                type="button"
                className="btn-add-pair"
                onClick={handleAddOtherItem}
                style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}
              >
                <span className="btn-add-icon">➕</span>
                <span>Agregar otro tipo de item</span>
              </button>

              {errors.shoePairs && <span className="error-message">{errors.shoePairs}</span>}

              <div className="total-price-preview">
                <span className="total-label">Total:</span>
                <span className="total-value">${calculateTotalPrice()}</span>
              </div>
            </div>
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
                {formData.advancePayment && (
                  <div className="payment-info">
                    <span>Total: ${calculateTotalPrice()} | </span>
                    <span>Restante: ${calculateTotalPrice() - parseFloat(formData.advancePayment || 0)}</span>
                  </div>
                )}
              </div>

              <div className="form-group full-width">
                <label className="form-label">Notas generales de la orden</label>
                <textarea
                  name="generalNotes"
                  className="form-input form-textarea"
                  placeholder="Notas generales que aplican a toda la orden..."
                  rows="3"
                  value={formData.generalNotes}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        const totalPrice = calculateTotalPrice();
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
                <h4 className="summary-section-title">👟 Pares de Tenis ({formData.shoePairs.length})</h4>
                {formData.shoePairs.map((pair, index) => (
                  <div key={pair.id} className="summary-pair">
                    <div className="summary-pair-header">Par #{index + 1}</div>
                    <div className="summary-row">
                      <span className="summary-label">Modelo:</span>
                      <span className="summary-value">{pair.model || '-'}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Servicio:</span>
                      <span className="summary-value">{pair.service || '-'}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Precio:</span>
                      <span className="summary-value price-highlight">${pair.price || '0'}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Fotos:</span>
                      <span className="summary-value">{pair.images?.length || 0} imagen{(pair.images?.length || 0) !== 1 ? 'es' : ''}</span>
                    </div>
                    {pair.notes && (
                      <div className="summary-row">
                        <span className="summary-label">Notas:</span>
                        <span className="summary-value">{pair.notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {formData.otherItems.length > 0 && (
                <div className="summary-section">
                  <h4 className="summary-section-title">📦 Otros Items ({formData.otherItems.length})</h4>
                  {formData.otherItems.map((item, index) => (
                    <div key={item.id} className="summary-pair">
                      <div className="summary-pair-header">Item #{index + 1}</div>
                      <div className="summary-row">
                        <span className="summary-label">Tipo:</span>
                        <span className="summary-value">{item.itemType || '-'}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">Descripción:</span>
                        <span className="summary-value">{item.description || '-'}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">Servicio:</span>
                        <span className="summary-value">{item.service || '-'}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">Precio:</span>
                        <span className="summary-value price-highlight">${item.price || '0'}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">Fotos:</span>
                        <span className="summary-value">{item.images?.length || 0} imagen{(item.images?.length || 0) !== 1 ? 'es' : ''}</span>
                      </div>
                      {item.notes && (
                        <div className="summary-row">
                          <span className="summary-label">Notas:</span>
                          <span className="summary-value">{item.notes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="summary-section">
                <h4 className="summary-section-title">💰 Pago</h4>
                <div className="summary-row">
                  <span className="summary-label">Precio Total:</span>
                  <span className="summary-value price-highlight">${totalPrice}</span>
                </div>
                {formData.advancePayment && (
                  <>
                    <div className="summary-row">
                      <span className="summary-label">Anticipo:</span>
                      <span className="summary-value">${formData.advancePayment}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Restante:</span>
                      <span className="summary-value">${totalPrice - parseFloat(formData.advancePayment || 0)}</span>
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

              {formData.generalNotes && (
                <div className="summary-section">
                  <h4 className="summary-section-title">📝 Notas Generales</h4>
                  <p className="summary-notes">{formData.generalNotes}</p>
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
          <div className="step-label">Pares</div>
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
