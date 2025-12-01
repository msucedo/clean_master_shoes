import { useState, useCallback } from 'react';
import { sanitizeInput, handleKeyPress as handleKeyPressUtil } from '../utils/inputValidation';

/**
 * Custom hook para manejar validación de inputs en tiempo real
 * @param {string} initialValue - Valor inicial
 * @param {string} type - Tipo de validación (TEXT, PHONE, NUMBER, etc.)
 * @param {object} options - Opciones adicionales
 * @returns {object} - { value, onChange, onKeyPress, onPaste, setValue, error }
 */
export const useInputValidation = (
  initialValue = '',
  type = 'TEXT',
  options = {}
) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const { maxLength, onChange: onChangeCallback } = options;

  /**
   * Maneja el cambio de valor del input
   */
  const onChange = useCallback(
    (e) => {
      let newValue = e.target.value;

      // Sanitizar el valor según el tipo
      newValue = sanitizeInput(newValue, type);

      // Aplicar límite de longitud si existe
      if (maxLength && newValue.length > maxLength) {
        newValue = newValue.substring(0, maxLength);
      }

      setValue(newValue);

      // Limpiar error cuando el usuario empieza a escribir
      if (error) {
        setError('');
      }

      // Callback personalizado
      if (onChangeCallback) {
        // Crear un evento sintético con el valor sanitizado
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: newValue,
          },
        };
        onChangeCallback(syntheticEvent);
      }
    },
    [type, maxLength, error, onChangeCallback]
  );

  /**
   * Maneja el evento onKeyPress para prevenir caracteres inválidos
   */
  const onKeyPress = useCallback(
    (e) => {
      const originalLength = e.target.value.length;

      // Si ya alcanzó el límite de caracteres, prevenir
      if (maxLength && originalLength >= maxLength && e.key.length === 1) {
        e.preventDefault();
        triggerFeedback();
        return;
      }

      handleKeyPressUtil(e, type);

      // Si se previno el evento, mostrar feedback
      if (e.defaultPrevented) {
        triggerFeedback();
      }
    },
    [type, maxLength]
  );

  /**
   * Maneja el evento onPaste para sanitizar contenido pegado
   */
  const onPaste = useCallback(
    (e) => {
      e.preventDefault();

      // Obtener texto del portapapeles
      const pastedText = e.clipboardData.getData('text');

      // Sanitizar el texto pegado
      let sanitizedText = sanitizeInput(pastedText, type);

      // Aplicar límite de longitud
      if (maxLength) {
        const currentLength = value.length;
        const availableSpace = maxLength - currentLength;
        sanitizedText = sanitizedText.substring(0, availableSpace);
      }

      // Obtener la posición del cursor
      const input = e.target;
      const start = input.selectionStart;
      const end = input.selectionEnd;

      // Crear el nuevo valor insertando el texto sanitizado
      const newValue =
        value.substring(0, start) + sanitizedText + value.substring(end);

      setValue(newValue);

      // Callback personalizado
      if (onChangeCallback) {
        const syntheticEvent = {
          target: {
            value: newValue,
          },
        };
        onChangeCallback(syntheticEvent);
      }

      // Mover el cursor al final del texto pegado
      setTimeout(() => {
        const newPosition = start + sanitizedText.length;
        input.setSelectionRange(newPosition, newPosition);
      }, 0);
    },
    [type, value, maxLength, onChangeCallback]
  );

  /**
   * Muestra feedback visual temporal
   */
  const triggerFeedback = useCallback(() => {
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 3000);
  }, []);

  /**
   * Resetea el valor del input
   */
  const reset = useCallback(() => {
    setValue(initialValue);
    setError('');
  }, [initialValue]);

  return {
    value,
    setValue,
    onChange,
    onKeyPress,
    onPaste,
    error,
    setError,
    showFeedback,
    reset,
  };
};

export default useInputValidation;
