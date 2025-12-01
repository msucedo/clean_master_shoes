import { useEffect } from 'react';
import { useInputValidation } from '../../hooks/useInputValidation';
import './ValidatedInput.css';

/**
 * Input de texto validado - Solo permite letras, acentos, ñ y espacios
 * Previene la entrada de números y caracteres especiales en tiempo real
 */
const ValidatedTextInput = ({
  name,
  value,
  onChange,
  label,
  placeholder = '',
  required = false,
  error = '',
  hint = '',
  maxLength,
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
  } = useInputValidation(value, 'TEXT', {
    maxLength,
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
          type="text"
          name={name}
          className={`form-input ${error ? 'error' : ''} ${
            showFeedback ? 'shake' : ''
          }`}
          placeholder={placeholder}
          value={internalValue}
          onChange={handleValidatedChange}
          onKeyPress={onKeyPress}
          onPaste={onPaste}
          autoFocus={autoFocus}
          disabled={disabled}
          maxLength={maxLength}
        />
        {showFeedback && (
          <div className="input-feedback">Solo se permiten letras</div>
        )}
      </div>
      {error && <span className="error-message">{error}</span>}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {maxLength && (
        <span className="character-count">
          {internalValue.length} / {maxLength}
        </span>
      )}
    </div>
  );
};

export default ValidatedTextInput;
