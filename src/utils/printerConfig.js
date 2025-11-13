/**
 * Configuración de método de impresión
 * Gestiona la preferencia del usuario sobre qué método usar
 */

const STORAGE_KEY = 'printer_method_preference';

// Métodos de impresión disponibles
export const PRINTER_METHODS = {
  QUEUE: 'queue',         // Impresión remota vía cola Firebase
  BLUETOOTH: 'bluetooth', // Bluetooth con ESC/POS (Android/Desktop)
  HTML: 'html'            // USB/Drivers con window.print (Desktop)
};

// Etiquetas descriptivas para la UI
export const PRINTER_METHOD_LABELS = {
  [PRINTER_METHODS.HTML]: 'USB/Drivers (window.print)',
  [PRINTER_METHODS.BLUETOOTH]: 'Bluetooth',
  [PRINTER_METHODS.QUEUE]: 'Impresión Remota en Cola'
};

// Descripciones de cada método
export const PRINTER_METHOD_DESCRIPTIONS = {
  [PRINTER_METHODS.HTML]: 'Para impresoras USB con drivers instalados (Mac/Windows/Linux)',
  [PRINTER_METHODS.BLUETOOTH]: 'Conexión directa por Bluetooth (Requiere emparejar impresora)',
  [PRINTER_METHODS.QUEUE]: 'Envía tickets a la PC del local para impresión automática (Ideal para móviles)'
};

/**
 * Obtener la preferencia del usuario desde localStorage
 * @returns {string} Método preferido ('html', 'bluetooth', 'queue')
 */
export const getPrinterMethodPreference = () => {
  try {
    const preference = localStorage.getItem(STORAGE_KEY);

    // Validar que sea un método válido
    if (preference && Object.values(PRINTER_METHODS).includes(preference)) {
      return preference;
    }

    // Default: Bluetooth
    return PRINTER_METHODS.BLUETOOTH;
  } catch (error) {
    console.error('Error al leer preferencia de impresión:', error);
    return PRINTER_METHODS.BLUETOOTH;
  }
};

/**
 * Guardar la preferencia del usuario en localStorage
 * @param {string} method - Método a guardar ('html', 'bluetooth', 'queue')
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

    // Disparar custom event para notificar el cambio
    window.dispatchEvent(new CustomEvent('printerMethodChanged', {
      detail: { method }
    }));

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
