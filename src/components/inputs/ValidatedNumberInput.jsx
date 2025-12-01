import { useEffect } from 'react';
import { useInputValidation } from '../../hooks/useInputValidation';
import './ValidatedInput.css';

/**
 * Input numérico validado - Solo permite números y punto decimal
 * Previene la entrada de letras y caracteres especiales en tiempo real
 * Soporta números enteros y decimales
 */
const ValidatedNumberInput = ({
  name,
  value,
  onChange,
  label,
  placeholder = '0.00',
  required = false,
  error = '',
  hint = '',
  autoFocus = false,
  disabled = false,
  className = '',
  min,
  max,
  step,
  integer = false, // Si es true, solo permite enteros (sin decimales)
  prefix = '', // Ej: '$' para moneda
  suffix = '', // Ej: 'kg', 'pzas'
}) => {
  const validationType = integer ? 'INTEGER' : 'NUMBER';

  const {
    value: internalValue,
    setValue,
    onChange: handleValidatedChange,
    onKeyPress,
    onPaste,
    showFeedback,
  } = useInputValidation(value, validationType, {
    onChange: (e) => {
      let newValue = e.target.value;

      // Para enteros, eliminar cualquier punto decimal
      if (integer && newValue.includes('.')) {
        newValue = newValue.replace('.', '');
      }

      // Prevenir múltiples puntos decimales
      if (!integer) {
        const parts = newValue.split('.');
        if (parts.length > 2) {
          newValue = parts[0] + '.' + parts.slice(1).join('');
        }
      }

      // Validar rango si está definido
      if (newValue && min !== undefined) {
        const numValue = parseFloat(newValue);
        if (!isNaN(numValue) && numValue < min) {
          // No prevenir, pero marcar como inválido
        }
      }

      if (newValue && max !== undefined) {
        const numValue = parseFloat(newValue);
        if (!isNaN(numValue) && numValue > max) {
          // No prevenir, pero marcar como inválido
        }
      }

      // Propagar el cambio al componente padre
      if (onChange) {
        onChange({
          target: {
            name,
            value: newValue,
          },
        });
      }
    },
  });

  // Sincronizar con el valor externo
  useEffect(() => {
    if (value !== internalValue) {
      setValue(value);
    }
  }, [value]);

  // Validar el rango actual
  const numValue = parseFloat(internalValue);
  const isOutOfRange =
    !isNaN(numValue) &&
    ((min !== undefined && numValue < min) ||
      (max !== undefined && numValue > max));

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label">
          {label}{' '}
          {required ? (
            <span className="required">*</span>
          ) : (
            <span className="optional">(Opcional)</span>
          )}
        </label>
      )}
      <div className="validated-input-wrapper number-input-wrapper">
        {prefix && <span className="input-prefix">{prefix}</span>}
        <input
          type="text"
          inputMode={integer ? 'numeric' : 'decimal'}
          name={name}
          className={`form-input ${error || isOutOfRange ? 'error' : ''} ${
            showFeedback ? 'shake' : ''
          } ${prefix ? 'with-prefix' : ''} ${suffix ? 'with-suffix' : ''}`}
          placeholder={placeholder}
          value={internalValue}
          onChange={handleValidatedChange}
          onKeyPress={onKeyPress}
          onPaste={onPaste}
          autoFocus={autoFocus}
          disabled={disabled}
          step={step}
        />
        {suffix && <span className="input-suffix">{suffix}</span>}
        {showFeedback && (
          <div className="input-feedback">
            {integer ? 'Solo se permiten números enteros' : 'Solo se permiten números'}
          </div>
        )}
      </div>
      {error && <span className="error-message">{error}</span>}
      {isOutOfRange && !error && (
        <span className="error-message">
          {min !== undefined && numValue < min && `El valor mínimo es ${min}`}
          {max !== undefined && numValue > max && `El valor máximo es ${max}`}
        </span>
      )}
      {hint && !error && !isOutOfRange && <span className="field-hint">{hint}</span>}
      {min !== undefined && max !== undefined && !hint && !error && !isOutOfRange && (
        <span className="field-hint">
          Rango: {min} - {max}
        </span>
      )}
    </div>
  );
};

export default ValidatedNumberInput;
