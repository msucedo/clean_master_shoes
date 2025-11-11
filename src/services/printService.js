/**
 * Servicio de Impresión Multi-Plataforma
 * Maneja impresión en Desktop, Android, iOS y PWA
 *
 * Estrategia por plataforma:
 * - Desktop: window.print() con HTML
 * - Android Chrome/PWA: Bluetooth + ESC/POS
 * - iOS Safari: Share API (fallback)
 * - Otros: Detección automática
 */

import { getBusinessProfile } from './firebaseService';
import {
  formatReceiptTicketHTML,
  formatDeliveryTicketHTML,
  formatReceiptTicketText,
  formatDeliveryTicketText,
  formatReceiptTicketESCPOS,
  formatDeliveryTicketESCPOS
} from '../utils/ticketFormatters';
import { bluetoothPrinter } from './bluetoothPrinterService';

/**
 * Detectar plataforma y capacidades del navegador
 */
export const detectPlatform = () => {
  const userAgent = navigator.userAgent || '';
  const isMobile = /iPhone|iPad|Android/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isChrome = /Chrome/i.test(userAgent) && !/Edge/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  const hasShareAPI = 'share' in navigator;
  const hasBluetooth = 'bluetooth' in navigator;
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;

  return {
    isMobile,
    isAndroid,
    isIOS,
    isChrome,
    isSafari,
    isPWA,
    hasShareAPI,
    hasBluetooth,
    userAgent,
    // Recomendar método de impresión
    recommendedMethod: _getRecommendedMethod({
      isMobile,
      isAndroid,
      isIOS,
      hasBluetooth,
      hasShareAPI,
      isPWA
    })
  };
};

/**
 * Determinar el mejor método de impresión para la plataforma
 */
function _getRecommendedMethod(capabilities) {
  const { isMobile, isAndroid, isIOS, hasBluetooth, hasShareAPI } = capabilities;

  // Desktop con Bluetooth: usar Bluetooth (Mac, Windows, Linux con Chrome/Edge)
  if (!isMobile && hasBluetooth) {
    return 'bluetooth';
  }

  // Desktop sin Bluetooth: HTML
  if (!isMobile) {
    return 'html';
  }

  // Android con Bluetooth: ESC/POS
  if (isAndroid && hasBluetooth) {
    return 'bluetooth';
  }

  // iOS: solo Share API disponible
  if (isIOS) {
    return 'share';
  }

  // Fallback: Share API si está disponible
  if (hasShareAPI) {
    return 'share';
  }

  // Último recurso: HTML
  return 'html';
}

/**
 * MÉTODO 1: Impresión Desktop con window.print()
 */
export const printTicketDesktop = async (order, businessInfo, ticketType) => {
  try {
    // Generar HTML según tipo de ticket
    let html;
    if (ticketType === 'receipt') {
      html = formatReceiptTicketHTML(order, businessInfo);
    } else if (ticketType === 'delivery') {
      html = formatDeliveryTicketHTML(order, businessInfo);
    } else {
      throw new Error('Tipo de ticket inválido');
    }

    // Crear ventana de impresión
    const printWindow = window.open('', '_blank', 'width=302,height=500');

    if (!printWindow) {
      throw new Error('No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por el navegador.');
    }

    // Escribir HTML
    printWindow.document.write(html);
    printWindow.document.close();

    // Esperar a que cargue y luego imprimir
    return new Promise((resolve, reject) => {
      printWindow.onload = () => {
        try {
          printWindow.focus();
          printWindow.print();

          // Cerrar ventana después de un pequeño delay
          setTimeout(() => {
            printWindow.close();
          }, 500);

          resolve({ success: true, method: 'desktop' });
        } catch (error) {
          printWindow.close();
          reject(error);
        }
      };

      // Timeout de seguridad
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.close();
        }
        reject(new Error('Timeout al cargar ventana de impresión'));
      }, 10000);
    });
  } catch (error) {
    console.error('Error en printTicketDesktop:', error);
    return { success: false, error: error.message };
  }
};

/**
 * MÉTODO 2: Impresión Bluetooth con ESC/POS (Android/Desktop)
 */
export const printTicketBluetooth = async (order, businessInfo, ticketType) => {
  try {
    // Verificar soporte Bluetooth
    if (!bluetoothPrinter.isSupported()) {
      throw new Error('Tu navegador no soporta Web Bluetooth API');
    }

    // Verificar si hay impresora conectada
    const status = bluetoothPrinter.getStatus();

    // Si no está conectada, intentar reconectar o conectar
    if (!status.isConnected) {
      // Verificar si hay impresora guardada
      const hasSaved = bluetoothPrinter.hasSavedPrinter();

      if (hasSaved) {
        console.log('📱 Impresora no conectada, intentando reconexión automática...');

        try {
          const reconnectResult = await bluetoothPrinter.reconnect();

          if (reconnectResult.success) {
            console.log('✅ Impresora reconectada automáticamente:', reconnectResult.deviceName);
          }
        } catch (error) {
          console.warn('⚠️ Reconexión automática falló:', error.message);
          console.log('📱 Solicitando selección manual de impresora...');

          const connectResult = await bluetoothPrinter.connect();

          if (!connectResult.success) {
            throw new Error('No se pudo conectar a la impresora');
          }

          console.log('✅ Impresora conectada manualmente:', connectResult.deviceName);
        }
      } else {
        console.log('📱 Sin impresora guardada, solicitando conexión...');

        const connectResult = await bluetoothPrinter.connect();

        if (!connectResult.success) {
          throw new Error('No se pudo conectar a la impresora');
        }

        console.log('✅ Impresora conectada:', connectResult.deviceName);
      }
    }

    // Generar comandos ESC/POS según tipo de ticket
    let escposData;
    if (ticketType === 'receipt') {
      escposData = formatReceiptTicketESCPOS(order, businessInfo);
    } else if (ticketType === 'delivery') {
      escposData = formatDeliveryTicketESCPOS(order, businessInfo);
    } else {
      throw new Error('Tipo de ticket inválido');
    }

    // Enviar a impresora
    console.log('🖨️  Enviando ticket a impresora...');
    await bluetoothPrinter.print(escposData);

    return {
      success: true,
      method: 'bluetooth',
      deviceName: status.deviceName
    };

  } catch (error) {
    console.error('Error en printTicketBluetooth:', error);

    // Si es error de usuario cancelando, no es un error crítico
    if (error.message.includes('No se seleccionó ninguna impresora')) {
      return {
        success: false,
        cancelled: true,
        error: error.message
      };
    }

    return {
      success: false,
      error: error.message,
      needsConnection: error.message.includes('no conectada')
    };
  }
};

/**
 * MÉTODO 3: Compartir como texto (iOS/Fallback)
 */
export const printTicketMobile = async (order, businessInfo, ticketType) => {
  try {
    // Verificar soporte Share API
    if (!('share' in navigator)) {
      throw new Error('Tu navegador no soporta la función de compartir');
    }

    // Generar texto según tipo de ticket
    let text;
    let title;

    if (ticketType === 'receipt') {
      text = formatReceiptTicketText(order, businessInfo);
      title = `Ticket de Recepción #${order.orderNumber || ''}`;
    } else if (ticketType === 'delivery') {
      text = formatDeliveryTicketText(order, businessInfo);
      title = `Comprobante de Entrega #${order.orderNumber || ''}`;
    } else {
      throw new Error('Tipo de ticket inválido');
    }

    // Llamar Share API
    await navigator.share({
      title: title,
      text: text
    });

    return { success: true, method: 'share' };
  } catch (error) {
    // Si el usuario cancela, el error es 'AbortError'
    if (error.name === 'AbortError') {
      return { success: false, cancelled: true };
    }

    console.error('Error en printTicketMobile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * FUNCIÓN PRINCIPAL: Imprimir ticket (inteligente según plataforma)
 *
 * @param {Object} order - Objeto de orden
 * @param {String} ticketType - 'receipt' o 'delivery'
 * @param {Object} options - Opciones adicionales
 * @returns {Promise} Resultado de la impresión
 */
export const printTicket = async (order, ticketType, options = {}) => {
  try {
    // Validar tipo de ticket
    if (!['receipt', 'delivery'].includes(ticketType)) {
      throw new Error('Tipo de ticket debe ser "receipt" o "delivery"');
    }

    // Obtener información del negocio desde Firebase
    const businessInfo = await getBusinessProfile();

    if (!businessInfo) {
      throw new Error('No se pudo obtener la información del negocio');
    }

    // Detectar plataforma
    const platform = detectPlatform();
    console.log('🖥️  Plataforma detectada:', platform);

    // Determinar método de impresión
    const forceMethod = options.method;
    const method = forceMethod || platform.recommendedMethod;

    console.log('📄 Método de impresión:', method);

    // Ejecutar según método seleccionado
    let result;

    switch (method) {
      case 'bluetooth':
        result = await printTicketBluetooth(order, businessInfo, ticketType);

        // Si falla Bluetooth, ofrecer fallback
        if (!result.success && !result.cancelled && options.allowFallback !== false) {
          console.log('⚠️  Bluetooth falló, intentando fallback...');

          if (platform.hasShareAPI) {
            result = await printTicketMobile(order, businessInfo, ticketType);
            result.usedFallback = true;
          }
        }
        break;

      case 'share':
        result = await printTicketMobile(order, businessInfo, ticketType);
        break;

      case 'html':
      default:
        result = await printTicketDesktop(order, businessInfo, ticketType);
        break;
    }

    return result;

  } catch (error) {
    console.error('Error en printTicket:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener estado de la impresora Bluetooth
 */
export const getPrinterStatus = () => {
  return bluetoothPrinter.getStatus();
};

/**
 * Conectar manualmente a impresora Bluetooth
 */
export const connectPrinter = async () => {
  try {
    const result = await bluetoothPrinter.connect();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Desconectar impresora Bluetooth
 */
export const disconnectPrinter = async () => {
  try {
    await bluetoothPrinter.disconnect();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Olvidar impresora guardada
 */
export const forgetPrinter = async () => {
  try {
    await bluetoothPrinter.forgetPrinter();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Reconectar a impresora guardada
 */
export const reconnectPrinter = async () => {
  try {
    const result = await bluetoothPrinter.reconnect();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Test de impresión
 */
export const testPrint = async () => {
  try {
    await bluetoothPrinter.testPrint();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
