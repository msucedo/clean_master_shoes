import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNotification } from '../contexts/NotificationContext';
import { ValidatedAlphanumericInput, ValidatedNumberInput } from './inputs';
import './ExpenseForm.css';

const ExpenseForm = ({ expense, onSave, onCancel }) => {
  const { showValidationErrors } = useNotification();
  const [formData, setFormData] = useState({
    concept: '',
    amount: '',
    category: 'general',
    date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (expense) {
      setFormData({
        concept: expense.concept || '',
        amount: expense.amount || '',
        category: expense.category || 'general',
        date: expense.date || new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        notes: expense.notes || ''
      });
    }
  }, [expense]);

  const categories = [
    { value: 'general', label: 'General', icon: '📋' },
    { value: 'supplies', label: 'Insumos', icon: '🧴' },
    { value: 'salary', label: 'Nómina', icon: '💵' },
    { value: 'services', label: 'Servicios', icon: '💡' },
    { value: 'equipment', label: 'Equipo', icon: '🛠️' },
    { value: 'maintenance', label: 'Mantenimiento', icon: '🔧' },
    { value: 'other', label: 'Otro', icon: '📦' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.concept.trim()) {
      newErrors.concept = 'El concepto es requerido';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      showValidationErrors(validationErrors);
      return;
    }

    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    onSave(expenseData);
  };

  return (
    <div className="expense-form">
      <div className="form-header">
        <h3>{expense ? 'Editar Gasto' : 'Nuevo Gasto'}</h3>
      </div>

      <form onSubmit={handleSubmit}>
        <ValidatedAlphanumericInput
          name="concept"
          value={formData.concept}
          onChange={handleChange}
          label="Concepto"
          placeholder="Ej: Compra de 5 productos limpieza"
          required={true}
          error={errors.concept}
          maxLength={100}
        />

        <div className="form-row">
          <ValidatedNumberInput
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            label="Monto"
            placeholder="0.00"
            required={true}
            error={errors.amount}
            min={0}
            step={0.01}
            prefix="$"
          />

          <div className="form-group">
            <label className="form-label">Fecha *</label>
            <input
              type="date"
              name="date"
              className={`form-input ${errors.date ? 'error' : ''}`}
              value={formData.date}
              onChange={handleChange}
            />
            {errors.date && <span className="error-message">{errors.date}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Categoría</label>
          <select
            name="category"
            className="form-input"
            value={formData.category}
            onChange={handleChange}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Notas</label>
          <textarea
            name="notes"
            className="form-input"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Notas adicionales (opcional)"
            rows={3}
            maxLength={500}
          />
          <div className="char-counter">{formData.notes.length}/500</div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            {expense ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

ExpenseForm.propTypes = {
  expense: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default ExpenseForm;
