import { useEffect } from 'react';
import { useInputValidation } from '../../hooks/useInputValidation';
import { validateEmail } from '../../utils/inputValidation';
import './ValidatedInput.css';

/**
 * Input de email validado - Permite caracteres válidos en emails
 * Previene espacios y caracteres inválidos en tiempo real
 * Valida formato completo de email
 */
const ValidatedEmailInput = ({
  name,
  value,
  onChange,
  label,
  placeholder = 'ejemplo@correo.com',
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
  } = useInputValidation(value, 'EMAIL', {
    onChange: (e) => {
      // Propagar el cambio al componente padre
      if (onChange) {
        onChange({
          target: {
            name,
            value: e.target.value,
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

  // Validar formato de email
  const isValidEmail = internalValue ? validateEmail(internalValue) : false;
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
          type="email"
          name={name}
          className={`form-input ${error ? 'error' : ''} ${
            showFeedback ? 'shake' : ''
          } ${isValidEmail && !error ? 'valid' : ''}`}
          placeholder={placeholder}
          value={internalValue}
          onChange={handleValidatedChange}
          onKeyPress={onKeyPress}
          onPaste={onPaste}
          autoFocus={autoFocus}
          disabled={disabled}
        />
        {showValidationIcon && !error && (
          <span className={`validation-icon ${isValidEmail ? 'valid' : 'incomplete'}`}>
            {isValidEmail ? '✓' : '✉'}
          </span>
        )}
        {showFeedback && (
          <div className="input-feedback">Carácter no permitido en email</div>
        )}
      </div>
      {error && <span className="error-message">{error}</span>}
      {!isValidEmail && !error && internalValue.length > 0 && (
        <span className="field-hint warning">Formato de email incompleto</span>
      )}
      {hint && !error && <span className="field-hint">{hint}</span>}
    </div>
  );
};

export default ValidatedEmailInput;
