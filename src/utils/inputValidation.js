/**
 * Utilidades de validación de inputs en tiempo real
 * Patrones regex y funciones helper para validar entrada de datos
 */

// Patrones de validación
export const PATTERNS = {
  // Solo letras (incluye acentos, ñ) y espacios
  TEXT: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/,

  // Solo dígitos (0-9)
  PHONE: /^[0-9]*$/,

  // Números con punto decimal
  NUMBER: /^[0-9]*\.?[0-9]*$/,

  // Números enteros solamente
  INTEGER: /^[0-9]*$/,

  // Email básico
  EMAIL: /^[^\s@]*@?[^\s@]*\.?[^\s@]*$/,

  // Alfanumérico (letras, números, espacios)
  ALPHANUMERIC: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]*$/,

  // Alfanumérico + caracteres especiales comunes
  ALPHANUMERIC_EXTENDED: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,;:()\[\]]*$/,
};

// Mensajes de error por tipo
export const ERROR_MESSAGES = {
  TEXT: 'Solo se permiten letras y espacios',
  PHONE: 'Solo se permiten números',
  NUMBER: 'Solo se permiten números y punto decimal',
  INTEGER: 'Solo se permiten números enteros',
  EMAIL: 'Formato de email inválido',
  ALPHANUMERIC: 'Solo se permiten letras, números y espacios',
  REQUIRED: 'Este campo es requerido',
  MIN_LENGTH: 'Mínimo {min} caracteres',
  MAX_LENGTH: 'Máximo {max} caracteres',
  MIN_VALUE: 'El valor mínimo es {min}',
  MAX_VALUE: 'El valor máximo es {max}',
};

/**
 * Valida si un valor cumple con el patrón especificado
 * @param {string} value - Valor a validar
 * @param {string} type - Tipo de validación (TEXT, PHONE, NUMBER, etc.)
 * @returns {boolean} - true si es válido
 */
export const validateInput = (value, type) => {
  if (!value) return true; // Valores vacíos son válidos (se valida required por separado)

  const pattern = PATTERNS[type];
  if (!pattern) {
    console.warn(`Tipo de validación desconocido: ${type}`);
    return true;
  }

  return pattern.test(value);
};

/**
 * Sanitiza un valor eliminando caracteres no permitidos
 * @param {string} value - Valor a sanitizar
 * @param {string} type - Tipo de validación
 * @returns {string} - Valor sanitizado
 */
export const sanitizeInput = (value, type) => {
  if (!value) return '';

  switch (type) {
    case 'TEXT':
      // Eliminar todo excepto letras, acentos, ñ y espacios
      return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');

    case 'PHONE':
    case 'INTEGER':
      // Eliminar todo excepto dígitos
      return value.replace(/[^0-9]/g, '');

    case 'NUMBER':
      // Eliminar todo excepto dígitos y punto decimal
      // Asegurar solo un punto decimal
      const parts = value.split('.');
      if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
      }
      return value.replace(/[^0-9.]/g, '');

    case 'EMAIL':
      // Eliminar espacios en email
      return value.replace(/\s/g, '');

    case 'ALPHANUMERIC':
      return value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '');

    case 'ALPHANUMERIC_EXTENDED':
      return value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,;:()\[\]]/g, '');

    default:
      return value;
  }
};

/**
 * Formatea un número de teléfono a 10 dígitos
 * @param {string} phone - Número de teléfono
 * @returns {string} - Teléfono formateado
 */
export const formatPhone = (phone) => {
  if (!phone) return '';

  // Eliminar todos los caracteres no numéricos
  const cleaned = phone.replace(/[^0-9]/g, '');

  // Limitar a 10 dígitos
  return cleaned.substring(0, 10);
};

/**
 * Valida un email completo
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido
 */
export const validateEmail = (email) => {
  if (!email) return false;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

/**
 * Valida un número de teléfono (debe ser exactamente 10 dígitos)
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} - true si es válido
 */
export const validatePhone = (phone) => {
  if (!phone) return false;

  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned.length === 10;
};

/**
 * Valida que un campo no esté vacío
 * @param {any} value - Valor a validar
 * @returns {boolean} - true si no está vacío
 */
export const validateRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined && value !== '';
};

/**
 * Valida longitud mínima
 * @param {string} value - Valor a validar
 * @param {number} min - Longitud mínima
 * @returns {boolean} - true si cumple
 */
export const validateMinLength = (value, min) => {
  if (!value) return true;
  return value.length >= min;
};

/**
 * Valida longitud máxima
 * @param {string} value - Valor a validar
 * @param {number} max - Longitud máxima
 * @returns {boolean} - true si cumple
 */
export const validateMaxLength = (value, max) => {
  if (!value) return true;
  return value.length <= max;
};

/**
 * Valida valor numérico mínimo
 * @param {number} value - Valor a validar
 * @param {number} min - Valor mínimo
 * @returns {boolean} - true si cumple
 */
export const validateMinValue = (value, min) => {
  if (value === null || value === undefined || value === '') return true;
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue >= min;
};

/**
 * Valida valor numérico máximo
 * @param {number} value - Valor a validar
 * @param {number} max - Valor máximo
 * @returns {boolean} - true si cumple
 */
export const validateMaxValue = (value, max) => {
  if (value === null || value === undefined || value === '') return true;
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue <= max;
};

/**
 * Obtiene el mensaje de error apropiado
 * @param {string} type - Tipo de error
 * @param {object} params - Parámetros adicionales (min, max, etc.)
 * @returns {string} - Mensaje de error
 */
export const getErrorMessage = (type, params = {}) => {
  let message = ERROR_MESSAGES[type] || 'Valor inválido';

  // Reemplazar placeholders
  Object.keys(params).forEach(key => {
    message = message.replace(`{${key}}`, params[key]);
  });

  return message;
};

/**
 * Maneja el evento onKeyPress para prevenir caracteres inválidos
 * @param {Event} e - Evento de teclado
 * @param {string} type - Tipo de validación
 */
export const handleKeyPress = (e, type) => {
  const char = e.key;

  // Permitir teclas de control (backspace, delete, arrows, tab, etc.)
  if (
    char === 'Backspace' ||
    char === 'Delete' ||
    char === 'Tab' ||
    char === 'ArrowLeft' ||
    char === 'ArrowRight' ||
    char === 'ArrowUp' ||
    char === 'ArrowDown' ||
    char === 'Home' ||
    char === 'End' ||
    char === 'Enter' ||
    (e.ctrlKey || e.metaKey) // Permitir Ctrl+C, Ctrl+V, etc.
  ) {
    return;
  }

  // Validar el carácter contra el patrón
  let pattern;
  switch (type) {
    case 'TEXT':
      pattern = /[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/;
      break;
    case 'PHONE':
    case 'INTEGER':
      pattern = /[0-9]/;
      break;
    case 'NUMBER':
      pattern = /[0-9.]/;
      break;
    case 'EMAIL':
      pattern = /[a-zA-Z0-9@._\-]/;
      break;
    case 'ALPHANUMERIC':
      pattern = /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/;
      break;
    default:
      return;
  }

  if (!pattern.test(char)) {
    e.preventDefault();
  }
};
