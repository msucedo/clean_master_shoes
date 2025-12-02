import { useState, useEffect } from 'react';
import { deleteField } from 'firebase/firestore';
import { useAdminCheck } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { ValidatedAlphanumericInput, ValidatedNumberInput } from './inputs';
import './PromotionForm.css';

const PromotionForm = ({ onSubmit, onCancel, onDelete, initialData = null, services = [], products = [], isSubmitting = false }) => {
  const isAdmin = useAdminCheck();
  const { showValidationErrors } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    emoji: '🎉',
    type: 'percentage',
    isActive: true,
    discountValue: '',
    appliesTo: 'all',
    specificItems: [],
    buyQuantity: 2,
    getQuantity: 1,
    discountPercentage: '',
    applicableItems: [],
    comboItems: [],
    comboPrice: '',
    daysOfWeek: [],
    // Restrictions
    hasDateRange: false,
    startDate: '',
    endDate: '',
    onePerClient: false,
    newClientsOnly: false,
    hasMaxUses: false,
    maxUses: '',
    hasMinPurchase: false,
    minPurchaseAmount: '',
    hasDayRestriction: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        emoji: initialData.emoji || '🎉',
        type: initialData.type || 'percentage',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        discountValue: initialData.discountValue || '',
        appliesTo: initialData.appliesTo || 'all',
        specificItems: initialData.specificItems || [],
        buyQuantity: initialData.buyQuantity || 2,
        getQuantity: initialData.getQuantity || 1,
        discountPercentage: initialData.discountPercentage || '',
        applicableItems: initialData.applicableItems || [],
        comboItems: (initialData.comboItems || []).map(ci => ({
          ...ci,
          quantity: ci.quantity || 1 // Compatibilidad con combos antiguos sin quantity
        })),
        comboPrice: initialData.comboPrice || '',
        daysOfWeek: initialData.daysOfWeek || [],
        // Restrictions
        hasDateRange: !!(initialData.dateRange?.startDate || initialData.dateRange?.endDate),
        startDate: initialData.dateRange?.startDate || '',
        endDate: initialData.dateRange?.endDate || '',
        onePerClient: initialData.onePerClient || false,
        newClientsOnly: initialData.newClientsOnly || false,
        hasMaxUses: !!initialData.maxUses,
        maxUses: initialData.maxUses || '',
        hasMinPurchase: !!initialData.minPurchaseAmount,
        minPurchaseAmount: initialData.minPurchaseAmount || '',
        hasDayRestriction: !!(initialData.daysOfWeek && initialData.daysOfWeek.length > 0)
      });
    }
  }, [initialData]);

  // Auto-scroll al top cuando se está enviando
  useEffect(() => {
    if (isSubmitting) {
      const formElement = document.querySelector('.promotion-form');
      if (formElement) {
        formElement.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [isSubmitting]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    // Type-specific validations
    if (formData.type === 'percentage' || formData.type === 'dayOfWeek') {
      if (!formData.discountValue || formData.discountValue <= 0 || formData.discountValue > 100) {
        newErrors.discountValue = 'El porcentaje debe estar entre 1 y 100';
      }
    }

    // Validar que percentage con 'specific' tenga items seleccionados
    if (formData.type === 'percentage' && formData.appliesTo === 'specific') {
      if (!formData.specificItems || formData.specificItems.length === 0) {
        newErrors.specificItems = 'Debes seleccionar al menos un item';
      }
    }

    if (formData.type === 'fixed') {
      if (!formData.discountValue || formData.discountValue <= 0) {
        newErrors.discountValue = 'El descuento debe ser mayor a 0';
      }
    }

    if (formData.type === 'buyXgetY') {
      if (!formData.buyQuantity || formData.buyQuantity < 1) {
        newErrors.buyQuantity = 'Cantidad de compra inválida';
      }
      if (!formData.getQuantity || formData.getQuantity < 1) {
        newErrors.getQuantity = 'Cantidad gratis inválida';
      }
    }

    if (formData.type === 'buyXgetYdiscount') {
      if (!formData.buyQuantity || formData.buyQuantity < 2) {
        newErrors.buyQuantity = 'Mínimo 2 items requeridos';
      }
      if (!formData.discountPercentage || formData.discountPercentage <= 0 || formData.discountPercentage > 100) {
        newErrors.discountPercentage = 'El descuento debe estar entre 1 y 100%';
      }
    }

    if (formData.type === 'combo') {
      if (!formData.comboPrice || formData.comboPrice <= 0) {
        newErrors.comboPrice = 'El precio del combo es requerido';
      }
      if (formData.comboItems.length < 2) {
        newErrors.comboItems = 'Selecciona al menos 2 items para el combo';
      }
    }

    if (formData.type === 'dayOfWeek' && formData.daysOfWeek.length === 0) {
      newErrors.daysOfWeek = 'Selecciona al menos un día';
    }

    // Validate day restriction (applies to all types)
    if (formData.hasDayRestriction && formData.daysOfWeek.length === 0) {
      newErrors.daysOfWeek = 'Selecciona al menos un día válido';
    }

    // Validate date range restriction
    if (formData.hasDateRange) {
      if (!formData.startDate && !formData.endDate) {
        newErrors.dateRange = 'Debes especificar al menos una fecha (inicio o fin)';
      } else if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        newErrors.dateRange = 'La fecha de inicio no puede ser posterior a la fecha fin';
      }
    }

    // Validate max uses restriction
    if (formData.hasMaxUses) {
      if (!formData.maxUses || formData.maxUses <= 0) {
        newErrors.maxUses = 'El número de usos debe ser mayor a 0';
      }
    }

    // Validate min purchase restriction
    if (formData.hasMinPurchase) {
      if (!formData.minPurchaseAmount || formData.minPurchaseAmount <= 0) {
        newErrors.minPurchaseAmount = 'El monto mínimo debe ser mayor a 0';
      }
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      showValidationErrors(validationErrors);
      return;
    }
    if (true) {
      // Detectar si es edición o creación
      const isEditing = !!initialData;

      // Prepare data based on type
      const promotionData = {
        name: formData.name,
        description: formData.description,
        emoji: formData.emoji,
        type: formData.type,
        isActive: formData.isActive
      };

      // Limpiar campos huérfanos de otros tipos al editar
      if (isEditing) {
        // Campos de percentage
        if (formData.type !== 'percentage') {
          promotionData.appliesTo = deleteField();
          promotionData.specificItems = deleteField();
        }

        // Campos de fixed, buyXgetY, buyXgetYdiscount
        if (!['fixed', 'buyXgetY', 'buyXgetYdiscount'].includes(formData.type)) {
          promotionData.applicableItems = deleteField();
        }

        // Campos de buyXgetY
        if (formData.type !== 'buyXgetY') {
          promotionData.getQuantity = deleteField();
          // buyQuantity también lo usa buyXgetYdiscount, solo limpiar si no es ninguno de los dos
          if (formData.type !== 'buyXgetYdiscount') {
            promotionData.buyQuantity = deleteField();
          }
        }

        // Campos de buyXgetYdiscount
        if (formData.type !== 'buyXgetYdiscount') {
          promotionData.discountPercentage = deleteField();
          // buyQuantity solo limpiar si tampoco es buyXgetY
          if (formData.type !== 'buyXgetY') {
            promotionData.buyQuantity = deleteField();
          }
        }

        // Campos de combo
        if (formData.type !== 'combo') {
          promotionData.comboItems = deleteField();
          promotionData.comboPrice = deleteField();
        }

        // Campo discountValue (usado por percentage, fixed, dayOfWeek)
        if (!['percentage', 'fixed', 'dayOfWeek'].includes(formData.type)) {
          promotionData.discountValue = deleteField();
        }
      }

      // Add type-specific fields
      if (formData.type === 'percentage' || formData.type === 'fixed' || formData.type === 'dayOfWeek') {
        promotionData.discountValue = parseFloat(formData.discountValue);
      }

      if (formData.type === 'percentage') {
        promotionData.appliesTo = formData.appliesTo;
        if (formData.appliesTo === 'specific') {
          promotionData.specificItems = formData.specificItems;
        }
      }

      if (formData.type === 'fixed') {
        promotionData.applicableItems = formData.applicableItems;
      }

      if (formData.type === 'buyXgetY') {
        promotionData.buyQuantity = parseInt(formData.buyQuantity);
        promotionData.getQuantity = parseInt(formData.getQuantity);
        promotionData.applicableItems = formData.applicableItems;
      }

      if (formData.type === 'buyXgetYdiscount') {
        promotionData.buyQuantity = parseInt(formData.buyQuantity);
        promotionData.discountPercentage = parseFloat(formData.discountPercentage);
        promotionData.applicableItems = formData.applicableItems;
      }

      if (formData.type === 'combo') {
        promotionData.comboItems = formData.comboItems;
        promotionData.comboPrice = parseFloat(formData.comboPrice);
      }

      if (formData.type === 'dayOfWeek') {
        promotionData.daysOfWeek = formData.daysOfWeek;
      }

      // Add day restriction (applies to all types)
      // Solo aplicar si NO es tipo dayOfWeek (que ya configuró daysOfWeek arriba)
      if (formData.type !== 'dayOfWeek') {
        if (formData.hasDayRestriction && formData.daysOfWeek.length > 0) {
          promotionData.daysOfWeek = formData.daysOfWeek;
        } else if (isEditing) {
          // Solo usar deleteField() al editar para eliminar campo existente
          promotionData.daysOfWeek = deleteField();
        }
        // Si es creación y no hay restricción, no incluir el campo
      }

      // Add restrictions
      if (formData.hasDateRange && (formData.startDate || formData.endDate)) {
        promotionData.dateRange = {
          startDate: formData.startDate || null,
          endDate: formData.endDate || null
        };
      } else if (isEditing) {
        // Solo usar deleteField() al editar para eliminar campo existente
        promotionData.dateRange = deleteField();
      }
      // Si es creación y no hay rango de fechas, no incluir el campo

      promotionData.onePerClient = formData.onePerClient;
      promotionData.newClientsOnly = formData.newClientsOnly;

      if (formData.hasMaxUses && formData.maxUses) {
        promotionData.maxUses = parseInt(formData.maxUses);
      } else if (isEditing) {
        // Solo usar deleteField() al editar para eliminar campo existente
        promotionData.maxUses = deleteField();
      }
      // Si es creación y no hay maxUses, no incluir el campo

      if (formData.hasMinPurchase && formData.minPurchaseAmount) {
        promotionData.minPurchaseAmount = parseFloat(formData.minPurchaseAmount);
      } else if (isEditing) {
        // Solo usar deleteField() al editar para eliminar campo existente
        promotionData.minPurchaseAmount = deleteField();
      }
      // Si es creación y no hay minPurchaseAmount, no incluir el campo

      onSubmit(promotionData);
    }
  };

  const allItems = [
    ...services.map(s => ({ id: s.id, name: s.name, type: 'service', price: s.price })),
    ...products.map(p => ({ id: p.id, name: p.name, type: 'product', price: p.salePrice }))
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <form className={`promotion-form ${isSubmitting ? 'submitting' : ''}`} onSubmit={handleSubmit}>
      <div className="promotion-form-wrapper">
        <div className="form-content">
        {/* Basic Info */}
        <div className="form-section">
          <h3>Información Básica</h3>

          <div className="form-row">
            <div className="form-group emoji-picker">
              <label>Emoji</label>
              <input
                type="text"
                name="emoji"
                value={formData.emoji}
                onChange={handleChange}
                maxLength={2}
                placeholder="🎉"
              />
            </div>

            <div className="form-group flex-grow">
              <ValidatedAlphanumericInput
                name="name"
                value={formData.name}
                onChange={handleChange}
                label="Nombre de la Promoción"
                placeholder="Ej: Promoción 2x1 Verano"
                required={true}
                error={errors.name}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Descripción *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe los detalles de la promoción"
              rows={3}
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <span>Promoción activa</span>
            </label>
          </div>
        </div>

        {/* Type Selection */}
        <div className="form-section">
          <h3>Tipo de Promoción</h3>
          <div className="promotion-types">
            <label className={`type-option ${formData.type === 'percentage' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="type"
                value="percentage"
                checked={formData.type === 'percentage'}
                onChange={handleChange}
              />
              <span className="type-label">
                <span className="type-icon">%</span>
                <span>
                  <span>Descuento %</span>
                  <small className="type-example">Ej: 20% OFF en Limpieza calzado blanco y gamusa</small>
                </span>
              </span>
            </label>

            <label className={`type-option ${formData.type === 'fixed' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="type"
                value="fixed"
                checked={formData.type === 'fixed'}
                onChange={handleChange}
              />
              <span className="type-label">
                <span className="type-icon">$</span>
                <span>
                  <span>Descuento Fijo</span>
                  <small className="type-example">Ej: $50 OFF en cualquier servicio</small>
                </span>
              </span>
            </label>

            <label className={`type-option ${formData.type === 'buyXgetY' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="type"
                value="buyXgetY"
                checked={formData.type === 'buyXgetY'}
                onChange={handleChange}
              />
              <span className="type-label">
                <span className="type-icon">2x1</span>
                <span>
                  <span>Compra y Lleva</span>
                  <small className="type-example">Ej: 2x1, 3x2 gratis</small>
                </span>
              </span>
            </label>

            <label className={`type-option ${formData.type === 'buyXgetYdiscount' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="type"
                value="buyXgetYdiscount"
                checked={formData.type === 'buyXgetYdiscount'}
                onChange={handleChange}
              />
              <span className="type-label">
                <span className="type-icon">🏷️</span>
                <span>
                  <span>Compra y Descuento</span>
                  <small className="type-example">Ej: 2do a 50% OFF</small>
                </span>
              </span>
            </label>

            <label className={`type-option ${formData.type === 'combo' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="type"
                value="combo"
                checked={formData.type === 'combo'}
                onChange={handleChange}
              />
              <span className="type-label">
                <span className="type-icon">📦</span>
                <span>
                  <span>Combo/Paquete</span>
                  <small className="type-example">Ej: 2 servicios por $200</small>
                </span>
              </span>
            </label>

            <label className={`type-option ${formData.type === 'dayOfWeek' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="type"
                value="dayOfWeek"
                checked={formData.type === 'dayOfWeek'}
                onChange={handleChange}
              />
              <span className="type-label">
                <span className="type-icon">📅</span>
                <span>
                  <span>Día de Semana</span>
                  <small className="type-example">Ej: Martes 15% OFF</small>
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Type-specific Configuration */}
        <div className="form-section">
          <h3>Configuración del Descuento</h3>

          {(formData.type === 'percentage' || formData.type === 'dayOfWeek') && (
            <div className="form-group">
              <ValidatedNumberInput
                name="discountValue"
                value={formData.discountValue}
                onChange={handleChange}
                label="Porcentaje de Descuento"
                placeholder="20"
                min={1}
                max={100}
                integer={false}
                suffix="%"
                required={true}
                error={errors.discountValue}
              />
            </div>
          )}

          {formData.type === 'fixed' && (
            <>
              <div className="form-group">
                <ValidatedNumberInput
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleChange}
                  label="Monto de Descuento"
                  placeholder="100"
                  min={0}
                  max={999999}
                  integer={false}
                  prefix="$"
                  required={true}
                  error={errors.discountValue}
                />
              </div>

              <div className="form-group">
                <label>Items Aplicables (opcional)</label>
                <div className="items-selector">
                  {allItems.map(item => (
                    <label key={item.id} className="item-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.applicableItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              applicableItems: [...prev.applicableItems, item.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              applicableItems: prev.applicableItems.filter(id => id !== item.id)
                            }));
                          }
                        }}
                      />
                      <span>{item.name}</span>
                    </label>
                  ))}
                </div>
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Si no seleccionas ninguno, el descuento aplicará a todo el carrito
                </small>
              </div>
            </>
          )}

          {formData.type === 'percentage' && (
            <>
              <div className="form-group">
                <label>Aplica a:</label>
                <select name="appliesTo" value={formData.appliesTo} onChange={handleChange}>
                  <option value="all">Todos los items</option>
                  <option value="services">Solo servicios</option>
                  <option value="products">Solo productos</option>
                  <option value="specific">Items específicos</option>
                </select>
              </div>

              {formData.appliesTo === 'specific' && (
                <div className="form-group">
                  <label>Selecciona Items *</label>
                  <div className={`items-selector ${errors.specificItems ? 'error' : ''}`}>
                    {allItems.map(item => (
                      <label key={item.id} className="item-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.specificItems.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                specificItems: [...prev.specificItems, item.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                specificItems: prev.specificItems.filter(id => id !== item.id)
                              }));
                            }
                            // Clear error when user makes a selection
                            if (errors.specificItems) {
                              setErrors(prev => ({ ...prev, specificItems: '' }));
                            }
                          }}
                        />
                        <span>{item.name} (${item.price})</span>
                      </label>
                    ))}
                  </div>
                  {errors.specificItems && <span className="error-message">{errors.specificItems}</span>}
                </div>
              )}
            </>
          )}

          {formData.type === 'buyXgetY' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <ValidatedNumberInput
                    name="buyQuantity"
                    value={formData.buyQuantity}
                    onChange={handleChange}
                    label="Total de Items"
                    placeholder="2"
                    min={2}
                    max={100}
                    integer={true}
                    required={true}
                    error={errors.buyQuantity}
                  />
                </div>

                <div className="form-group">
                  <ValidatedNumberInput
                    name="getQuantity"
                    value={formData.getQuantity}
                    onChange={handleChange}
                    label="Cantidad Gratis"
                    placeholder="1"
                    min={1}
                    max={100}
                    integer={true}
                    required={true}
                    error={errors.getQuantity}
                  />
                </div>
              </div>

              <div className="help-text" style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#1e3a8a'
              }}>
                <strong>💡 Ejemplos:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li><strong>2x1</strong> (lleva 2, paga 1): Total=<strong>2</strong>, Gratis=<strong>1</strong></li>
                  <li><strong>3x2</strong> (lleva 3, paga 2): Total=<strong>3</strong>, Gratis=<strong>1</strong></li>
                  <li><strong>4x3</strong> (lleva 4, paga 3): Total=<strong>4</strong>, Gratis=<strong>1</strong></li>
                </ul>
              </div>

              <div className="form-group">
                <label>Items Aplicables (opcional)</label>
                <div className="items-selector">
                  {allItems.map(item => (
                    <label key={item.id} className="item-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.applicableItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              applicableItems: [...prev.applicableItems, item.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              applicableItems: prev.applicableItems.filter(id => id !== item.id)
                            }));
                          }
                        }}
                      />
                      <span>{item.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {formData.type === 'buyXgetYdiscount' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <ValidatedNumberInput
                    name="buyQuantity"
                    value={formData.buyQuantity}
                    onChange={handleChange}
                    label="Cantidad de Items"
                    placeholder="2"
                    min={2}
                    max={100}
                    integer={true}
                    required={true}
                    error={errors.buyQuantity}
                  />
                </div>

                <div className="form-group">
                  <ValidatedNumberInput
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleChange}
                    label="% de Descuento"
                    placeholder="50"
                    min={1}
                    max={100}
                    integer={false}
                    suffix="%"
                    required={true}
                    error={errors.discountPercentage}
                  />
                </div>
              </div>

              <div className="help-text" style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#1e3a8a'
              }}>
                <strong>💡 Ejemplos:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li><strong>2do a 50% OFF</strong>: Cantidad=<strong>2</strong>, Descuento=<strong>50</strong>%</li>
                  <li><strong>3ro a 30% OFF</strong>: Cantidad=<strong>3</strong>, Descuento=<strong>30</strong>%</li>
                  <li><strong>4to a 25% OFF</strong>: Cantidad=<strong>4</strong>, Descuento=<strong>25</strong>%</li>
                </ul>
              </div>

              <div className="form-group">
                <label>Items Aplicables (opcional)</label>
                <div className="items-selector">
                  {allItems.map(item => (
                    <label key={item.id} className="item-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.applicableItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              applicableItems: [...prev.applicableItems, item.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              applicableItems: prev.applicableItems.filter(id => id !== item.id)
                            }));
                          }
                        }}
                      />
                      <span>{item.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {formData.type === 'combo' && (
            <>
              <div className="form-group">
                <ValidatedNumberInput
                  name="comboPrice"
                  value={formData.comboPrice}
                  onChange={handleChange}
                  label="Precio del Combo"
                  placeholder="150"
                  min={0}
                  max={999999}
                  integer={false}
                  prefix="$"
                  required={true}
                  error={errors.comboPrice}
                />
              </div>

              <div className="form-group">
                <label>Items del Combo (mínimo 2) *</label>
                <div className="items-selector">
                  {allItems.map(item => (
                    <label key={item.id} className="item-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.comboItems.some(ci => ci.id === item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              comboItems: [...prev.comboItems, { id: item.id, name: item.name, price: item.price, quantity: 1 }]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              comboItems: prev.comboItems.filter(ci => ci.id !== item.id)
                            }));
                          }
                        }}
                      />
                      <span>{item.name} (${item.price})</span>
                    </label>
                  ))}
                </div>

                {/* Mostrar items seleccionados con cantidades */}
                {formData.comboItems.length > 0 && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <strong style={{ display: 'block', marginBottom: '8px' }}>Cantidades por item:</strong>
                    {formData.comboItems.map((comboItem, idx) => (
                      <div key={comboItem.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ flex: 1 }}>{comboItem.name}</span>
                        <input
                          type="number"
                          min="1"
                          value={comboItem.quantity || 1}
                          onChange={(e) => {
                            const newQty = parseInt(e.target.value) || 1;
                            setFormData(prev => ({
                              ...prev,
                              comboItems: prev.comboItems.map(ci =>
                                ci.id === comboItem.id ? { ...ci, quantity: newQty } : ci
                              )
                            }));
                          }}
                          style={{ width: '70px', padding: '4px 8px', textAlign: 'center' }}
                        />
                        <span style={{ width: '30px', textAlign: 'right' }}>x</span>
                      </div>
                    ))}
                  </div>
                )}

                {errors.comboItems && <span className="error-message">{errors.comboItems}</span>}
              </div>
            </>
          )}

          {formData.type === 'dayOfWeek' && (
            <div className="form-group">
              <label>Días de la Semana *</label>
              <div className="days-selector">
                {dayNames.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`day-button ${formData.daysOfWeek.includes(index) ? 'selected' : ''}`}
                    onClick={() => handleDayToggle(index)}
                  >
                    {day}
                  </button>
                ))}
              </div>
              {errors.daysOfWeek && <span className="error-message">{errors.daysOfWeek}</span>}
            </div>
          )}
        </div>

        {/* Restrictions */}
        <div className="form-section">
          <h3>Restricciones (Opcional)</h3>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hasDateRange"
                checked={formData.hasDateRange}
                onChange={handleChange}
              />
              <span>Rango de fechas</span>
            </label>
          </div>

          {formData.hasDateRange && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha Inicio</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={errors.dateRange ? 'error' : ''}
                  />
                </div>

                <div className="form-group">
                  <label>Fecha Fin</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className={errors.dateRange ? 'error' : ''}
                  />
                </div>
              </div>
              {errors.dateRange && <span className="error-message" style={{ marginTop: '-8px', display: 'block' }}>{errors.dateRange}</span>}
            </>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="onePerClient"
                checked={formData.onePerClient}
                onChange={handleChange}
              />
              <span>Un uso por cliente</span>
            </label>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="newClientsOnly"
                checked={formData.newClientsOnly}
                onChange={handleChange}
              />
              <span>Solo clientes nuevos</span>
            </label>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hasMaxUses"
                checked={formData.hasMaxUses}
                onChange={handleChange}
              />
              <span>Límite de usos totales</span>
            </label>
          </div>

          {formData.hasMaxUses && (
            <div className="form-group">
              <ValidatedNumberInput
                name="maxUses"
                value={formData.maxUses}
                onChange={handleChange}
                label="Número Máximo de Usos"
                placeholder="100"
                min={1}
                max={999999}
                integer={true}
                required={true}
                error={errors.maxUses}
              />
            </div>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hasMinPurchase"
                checked={formData.hasMinPurchase}
                onChange={handleChange}
              />
              <span>Monto mínimo de compra</span>
            </label>
          </div>

          {formData.hasMinPurchase && (
            <div className="form-group">
              <ValidatedNumberInput
                name="minPurchaseAmount"
                value={formData.minPurchaseAmount}
                onChange={handleChange}
                label="Monto Mínimo"
                placeholder="500"
                min={0}
                max={999999}
                integer={false}
                prefix="$"
                required={true}
                error={errors.minPurchaseAmount}
              />
            </div>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hasDayRestriction"
                checked={formData.hasDayRestriction}
                onChange={handleChange}
              />
              <span>Solo en días específicos</span>
            </label>
          </div>

          {formData.hasDayRestriction && (
            <div className="form-group">
              <label>Días Válidos: *</label>
              <div className="days-selector">
                {dayNames.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`day-button ${formData.daysOfWeek.includes(index) ? 'selected' : ''}`}
                    onClick={() => {
                      handleDayToggle(index);
                      // Clear error when user makes a selection
                      if (errors.daysOfWeek) {
                        setErrors(prev => ({ ...prev, daysOfWeek: '' }));
                      }
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
              {errors.daysOfWeek && formData.hasDayRestriction && <span className="error-message">{errors.daysOfWeek}</span>}
            </div>
          )}
        </div>
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
        {initialData && isAdmin && (
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              if (confirm(`¿Eliminar la promoción "${formData.name}"?`)) {
                onDelete(initialData.id);
              }
            }}
            disabled={isSubmitting}
          >
            Eliminar
          </button>
        )}
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
            : `${initialData ? 'Actualizar' : 'Crear'} Promoción`
          }
        </button>
      </div>

      {/* Success Animation Overlay */}
      {isSubmitting && (
        <div className="success-overlay">
          <div className="success-animation">
            <div className="success-checkmark">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <h2 className="success-title">
              {initialData ? '¡Promoción Actualizada!' : '¡Promoción Creada!'}
            </h2>
            <p className="success-message">Procesando...</p>
          </div>
        </div>
      )}
      </div>
    </form>
  );
};

export default PromotionForm;
