/**
 * Configuración de método de impresión
 * Gestiona la preferencia del usuario sobre qué método usar
 */

const STORAGE_KEY = 'printer_method_preference';

// Métodos de impresión disponibles
export const PRINTER_METHODS = {
  AUTO: 'auto',           // Detección automática según dispositivo
  HTML: 'html',           // USB/Drivers con window.print (Desktop)
  BLUETOOTH: 'bluetooth', // Bluetooth con ESC/POS (Android/Desktop)
  SHARE: 'share'          // Share API con PDF (iOS/Mobile)
};

// Etiquetas descriptivas para la UI
export const PRINTER_METHOD_LABELS = {
  [PRINTER_METHODS.AUTO]: 'Automático (Recomendado)',
  [PRINTER_METHODS.HTML]: 'USB/Drivers (window.print)',
  [PRINTER_METHODS.BLUETOOTH]: 'Bluetooth',
  [PRINTER_METHODS.SHARE]: 'Compartir (PDF)'
};

// Descripciones de cada método
export const PRINTER_METHOD_DESCRIPTIONS = {
  [PRINTER_METHODS.AUTO]: 'Detecta el mejor método para tu dispositivo automáticamente',
  [PRINTER_METHODS.HTML]: 'Para impresoras USB con drivers instalados (Mac/Windows/Linux)',
  [PRINTER_METHODS.BLUETOOTH]: 'Conexión directa por Bluetooth (Requiere emparejar impresora)',
  [PRINTER_METHODS.SHARE]: 'Para apps de impresión móvil (iOS, Android sin Bluetooth)'
};

/**
 * Obtener la preferencia del usuario desde localStorage
 * @returns {string} Método preferido ('auto', 'html', 'bluetooth', 'share')
 */
export const getPrinterMethodPreference = () => {
  try {
    const preference = localStorage.getItem(STORAGE_KEY);

    // Validar que sea un método válido
    if (preference && Object.values(PRINTER_METHODS).includes(preference)) {
      return preference;
    }

    // Default: automático
    return PRINTER_METHODS.AUTO;
  } catch (error) {
    console.error('Error al leer preferencia de impresión:', error);
    return PRINTER_METHODS.AUTO;
  }
};

/**
 * Guardar la preferencia del usuario en localStorage
 * @param {string} method - Método a guardar ('auto', 'html', 'bluetooth', 'share')
 * @returns {boolean} true si se guardó correctamente, false si hubo error
 */
export const setPrinterMethodPreference = (method) => {
  try {
    // Validar que sea un método válido
    if (!Object.values(PRINTER_METHODS).includes(method)) {
      console.error('Método de impresión inválido:', method);
      return false;
    }

    localStorage.setItem(STORAGE_KEY, method);
    return true;
  } catch (error) {
    console.error('Error al guardar preferencia de impresión:', error);
    return false;
  }
};

/**
 * Resetear preferencia a automático
 */
export const resetPrinterMethodPreference = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error al resetear preferencia de impresión:', error);
    return false;
  }
};
