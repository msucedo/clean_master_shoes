import { useEffect } from 'react';
import { useInputValidation } from '../../hooks/useInputValidation';
import { formatPhone } from '../../utils/inputValidation';
import './ValidatedInput.css';

/**
 * Input de teléfono validado - Solo permite dígitos (0-9)
 * Previene la entrada de letras y caracteres especiales en tiempo real
 * Limita a 10 dígitos
 */
const ValidatedPhoneInput = ({
  name,
  value,
  onChange,
  label,
  placeholder = '5551234567',
  required = false,
  error = '',
  hint = '',
  autoFocus = false,
  disabled = false,
  className = '',
}) => {
  const {
    value: internalValue,
    setValue,
    onChange: handleValidatedChange,
    onKeyPress,
    onPaste,
    showFeedback,
  } = useInputValidation(value, 'PHONE', {
    maxLength: 10,
    onChange: (e) => {
      // Formatear el teléfono (solo dígitos, máximo 10)
      const formatted = formatPhone(e.target.value);

      // Propagar el cambio al componente padre
      if (onChange) {
        onChange({
          target: {
            name,
            value: formatted,
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

  // Mostrar indicador de validez (10 dígitos)
  const isValid = internalValue.length === 10;
  const showValidationIcon = internalValue.length > 0;

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
      <div className="validated-input-wrapper">
        <input
          type="tel"
          name={name}
          className={`form-input ${error ? 'error' : ''} ${
            showFeedback ? 'shake' : ''
          } ${isValid && !error ? 'valid' : ''}`}
          placeholder={placeholder}
          value={internalValue}
          onChange={handleValidatedChange}
          onKeyPress={onKeyPress}
          onPaste={onPaste}
          autoFocus={autoFocus}
          disabled={disabled}
          maxLength={10}
        />
        {showValidationIcon && !error && (
          <span className={`validation-icon ${isValid ? 'valid' : 'incomplete'}`}>
            {isValid ? '✓' : `${internalValue.length}/10`}
          </span>
        )}
        {showFeedback && (
          <div className="input-feedback">
            {internalValue.length >= 10
              ? 'Máximo 10 dígitos alcanzado'
              : 'Solo se permiten números'}
          </div>
        )}
      </div>
      {error && <span className="error-message">{error}</span>}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {!hint && !error && (
        <span className="field-hint">Ingresa 10 dígitos</span>
      )}
    </div>
  );
};

export default ValidatedPhoneInput;
