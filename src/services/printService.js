/**
 * Servicio de Impresión de Tickets
 * Maneja la impresión en desktop (window.print) y móvil (Share API)
 */

import { getBusinessProfile } from './firebaseService';
import {
  formatReceiptTicketHTML,
  formatDeliveryTicketHTML,
  formatReceiptTicketText,
  formatDeliveryTicketText
} from '../utils/ticketFormatters';

/**
 * Detectar plataforma y capacidades del navegador
 */
export const detectPlatform = () => {
  const userAgent = navigator.userAgent || '';
  const isMobile = /iPhone|iPad|Android/i.test(userAgent);
  const hasShareAPI = 'share' in navigator;

  return {
    isMobile,
    hasShareAPI,
    userAgent
  };
};

/**
 * Imprimir ticket en desktop usando window.print()
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
 * Imprimir ticket en móvil usando Share API
 */
export const printTicketMobile = async (order, businessInfo, ticketType) => {
  try {
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

    return { success: true, method: 'mobile' };
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
 * @returns {Promise} Resultado de la impresión
 */
export const printTicket = async (order, ticketType) => {
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

    // Decidir método de impresión
    if (platform.isMobile && platform.hasShareAPI) {
      // Móvil con Share API
      return await printTicketMobile(order, businessInfo, ticketType);
    } else if (!platform.isMobile) {
      // Desktop
      return await printTicketDesktop(order, businessInfo, ticketType);
    } else {
      // Móvil sin Share API
      throw new Error('Tu navegador no soporta la funcionalidad de compartir. Intenta actualizar tu navegador o usa la versión de escritorio.');
    }
  } catch (error) {
    console.error('Error en printTicket:', error);
    return { success: false, error: error.message };
  }
};
