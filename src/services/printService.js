/**
 * Servicio de Impresión Multi-Plataforma
 * Maneja impresión en Desktop, Android y PWA
 *
 * Estrategia por plataforma:
 * - Desktop: window.print() con HTML
 * - Android Chrome/PWA: Bluetooth + ESC/POS
 * - Otros: Detección automática
 */

import { getBusinessProfile } from './firebaseService';
import {
  formatReceiptTicketHTML,
  formatDeliveryTicketHTML,
  formatReceiptTicketESCPOS,
  formatDeliveryTicketESCPOS
} from '../utils/ticketFormatters';
import { generateTicketPDFBlob } from '../utils/ticketPDFGenerator';
import { bluetoothPrinter } from './bluetoothPrinterService';
import { getPrinterMethodPreference, PRINTER_METHODS, getNumberOfCopies } from '../utils/printerConfig';

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
  const hasBluetooth = 'bluetooth' in navigator;
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;

  return {
    isMobile,
    isAndroid,
    isIOS,
    isChrome,
    isSafari,
    isPWA,
    hasBluetooth,
    userAgent,
    // Recomendar método de impresión
    recommendedMethod: _getRecommendedMethod({
      isMobile,
      isAndroid,
      isIOS,
      hasBluetooth,
      isPWA
    })
  };
};

/**
 * Determinar el mejor método de impresión para la plataforma
 * CAMBIO: Desktop ahora prioriza HTML (window.print con drivers USB)
 */
function _getRecommendedMethod(capabilities) {
  const { isMobile, isAndroid, hasBluetooth } = capabilities;

  // Desktop (Mac, Windows, Linux): SIEMPRE usar HTML con drivers USB
  // Esto permite usar impresoras USB con drivers instalados
  if (!isMobile) {
    return 'html';
  }

  // Android con Bluetooth: ESC/POS
  if (isAndroid && hasBluetooth) {
    return 'bluetooth';
  }

  // Fallback: HTML
  return 'html';
}

/**
 * MÉTODO 1: Impresión Desktop con window.print()
 */
export const printTicketDesktop = async (order, businessInfo, ticketType, copyInfo = null) => {
  try {
    // Generar HTML según tipo de ticket
    let html;
    if (ticketType === 'receipt') {
      html = formatReceiptTicketHTML(order, businessInfo, copyInfo);
    } else if (ticketType === 'delivery') {
      html = formatDeliveryTicketHTML(order, businessInfo, copyInfo);
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
export const printTicketBluetooth = async (order, businessInfo, ticketType, copyInfo = null) => {
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
      escposData = formatReceiptTicketESCPOS(order, businessInfo, copyInfo);
    } else if (ticketType === 'delivery') {
      escposData = formatDeliveryTicketESCPOS(order, businessInfo, copyInfo);
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

    // Obtener número de copias configurado
    const numberOfCopies = getNumberOfCopies();
    console.log(`📋 Número de copias configurado: ${numberOfCopies}`);

    // Detectar plataforma
    const platform = detectPlatform();
    console.log('🖥️  Plataforma detectada:', platform);

    // Obtener preferencia del usuario
    const userPreference = getPrinterMethodPreference();
    console.log('⚙️  Preferencia del usuario:', userPreference);

    // Determinar método de impresión
    let method;

    // Prioridad: 1) options.method (llamada directa), 2) preferencia usuario
    if (options.method) {
      method = options.method;
    } else {
      // Usuario eligió método específico: respetarlo
      method = userPreference;
    }

    console.log('📄 Método de impresión:', method);

    // Ejecutar impresión según número de copias
    let result;

    if (numberOfCopies === 1) {
      // Imprimir una sola copia sin identificador
      switch (method) {
        case 'bluetooth':
          result = await printTicketBluetooth(order, businessInfo, ticketType, null);
          break;

        case 'html':
        default:
          result = await printTicketDesktop(order, businessInfo, ticketType, null);
          break;
      }
    } else {
      // Imprimir múltiples copias con identificadores
      const copyLabels = ['COPIA CLIENTE', 'COPIA NEGOCIO'];

      for (let i = 0; i < numberOfCopies; i++) {
        const copyInfo = copyLabels[i];
        console.log(`🖨️  Imprimiendo ${copyInfo}...`);

        switch (method) {
          case 'bluetooth':
            result = await printTicketBluetooth(order, businessInfo, ticketType, copyInfo);
            break;

          case 'html':
          default:
            result = await printTicketDesktop(order, businessInfo, ticketType, copyInfo);
            break;
        }

        // Si hubo error en alguna copia, detener
        if (!result.success) {
          break;
        }

        // Delay entre impresiones (excepto después de la última)
        if (i < numberOfCopies - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
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
