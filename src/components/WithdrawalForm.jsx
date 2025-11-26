import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ExpenseForm.css'; // Reutilizamos los estilos de ExpenseForm

const WithdrawalForm = ({ withdrawal, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    concept: '',
    amount: '',
    date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (withdrawal) {
      setFormData({
        concept: withdrawal.concept || '',
        amount: withdrawal.amount || '',
        date: withdrawal.date || new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        notes: withdrawal.notes || ''
      });
    }
  }, [withdrawal]);

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
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const withdrawalData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    onSave(withdrawalData);
  };

  return (
    <div className="expense-form">
      <div className="form-header">
        <h3>{withdrawal ? 'Editar Retiro' : 'Nuevo Retiro'}</h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Concepto *</label>
          <input
            type="text"
            name="concept"
            className={`form-input ${errors.concept ? 'error' : ''}`}
            value={formData.concept}
            onChange={handleChange}
            placeholder="Ej: Depósito banco, Retiro personal"
            maxLength={100}
          />
          {errors.concept && <span className="error-message">{errors.concept}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Monto *</label>
            <input
              type="number"
              name="amount"
              className={`form-input ${errors.amount ? 'error' : ''}`}
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
            {errors.amount && <span className="error-message">{errors.amount}</span>}
          </div>

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
            {withdrawal ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

WithdrawalForm.propTypes = {
  withdrawal: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default WithdrawalForm;
