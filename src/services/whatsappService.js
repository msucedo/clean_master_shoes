/**
 * WhatsApp Business API Service
 *
 * Provides functionality to send automated WhatsApp messages to customers
 * when their orders are ready for delivery.
 *
 * Prerequisites:
 * - WhatsApp Business API configured (see WHATSAPP_SETUP.md)
 * - Environment variables properly set in .env file
 */

import axios from 'axios';

// WhatsApp API Configuration from environment variables
const WHATSAPP_CONFIG = {
  accessToken: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID,
  apiVersion: import.meta.env.VITE_WHATSAPP_API_VERSION || 'v21.0',
  enabled: import.meta.env.VITE_WHATSAPP_ENABLED === 'true',
  businessName: import.meta.env.VITE_BUSINESS_NAME || 'Clean Master Shoes',
  businessAddress: import.meta.env.VITE_BUSINESS_ADDRESS || '',
};

/**
 * Check if WhatsApp integration is properly configured
 * @returns {boolean} True if configured, false otherwise
 */
export const isWhatsAppConfigured = () => {
  return !!(
    WHATSAPP_CONFIG.enabled &&
    WHATSAPP_CONFIG.accessToken &&
    WHATSAPP_CONFIG.phoneNumberId &&
    WHATSAPP_CONFIG.accessToken !== 'your_whatsapp_access_token_here'
  );
};

/**
 * Format phone number to WhatsApp format (remove all non-digits)
 * @param {string} phone - Phone number in any format
 * @returns {string} Phone number with only digits
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // If doesn't start with country code, assume Mexico (+52)
  // Adjust this logic based on your country
  if (cleaned.length === 10) {
    return `52${cleaned}`; // Mexico country code
  }
  return cleaned;
};

/**
 * Format the list of services for the WhatsApp message
 * @param {Array} services - Array of service objects
 * @returns {string} Formatted services list
 */
const formatServicesList = (services) => {
  if (!services || services.length === 0) {
    return 'Tu pedido';
  }

  return services
    .map((service) => `• ${service.serviceName}`)
    .join('\n');
};

/**
 * Build the WhatsApp message text for delivery notification
 * @param {Object} order - Order object
 * @returns {string} Formatted message
 */
const buildDeliveryMessage = (order) => {
  const servicesList = formatServicesList(order.services);
  const addressInfo = WHATSAPP_CONFIG.businessAddress
    ? `\n\nTe esperamos en:\n${WHATSAPP_CONFIG.businessAddress}`
    : '';

  return `¡Hola ${order.client}! 👋

Tu orden #${order.orderNumber || order.id} está lista para entrega. 🎉

Servicios listos:
${servicesList}${addressInfo}

¡Gracias por tu preferencia!

- ${WHATSAPP_CONFIG.businessName}`;
};

/**
 * Send WhatsApp message using WhatsApp Cloud API
 * @param {string} to - Recipient phone number (with country code)
 * @param {string} message - Message text to send
 * @returns {Promise<Object>} API response with message ID and status
 */
const sendWhatsAppMessage = async (to, message) => {
  const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'text',
    text: {
      preview_url: false,
      body: message
    }
  };

  const config = {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await axios.post(url, payload, config);

    console.log('✅ WhatsApp message sent successfully:', {
      messageId: response.data.messages[0].id,
      to: to,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      messageId: response.data.messages[0].id,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', {
      error: error.response?.data || error.message,
      to: to,
      timestamp: new Date().toISOString()
    });

    // Return error details
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      errorCode: error.response?.data?.error?.code,
      timestamp: new Date().toISOString(),
      status: 'failed'
    };
  }
};

/**
 * Send delivery notification to customer when order status changes to "En Entrega"
 * This is the main function called by firebaseService when updating order status
 *
 * @param {Object} order - Complete order object with customer info
 * @returns {Promise<Object>} Result object with success status and details
 */
export const sendDeliveryNotification = async (order) => {
  // Check if WhatsApp is configured
  if (!isWhatsAppConfigured()) {
    console.warn('⚠️ WhatsApp is not configured. Skipping notification.');
    return {
      success: false,
      error: 'WhatsApp not configured',
      skipped: true
    };
  }

  // Validate order has required fields
  if (!order.client || !order.phone) {
    console.error('❌ Order missing required fields (client or phone)');
    return {
      success: false,
      error: 'Missing client name or phone number'
    };
  }

  try {
    // Format phone number
    const formattedPhone = formatPhoneNumber(order.phone);

    if (!formattedPhone) {
      throw new Error('Invalid phone number format');
    }

    // Build message
    const message = buildDeliveryMessage(order);

    // Send message via WhatsApp API
    const result = await sendWhatsAppMessage(formattedPhone, message);

    // Return result with additional order context
    return {
      ...result,
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientName: order.client,
      phone: formattedPhone,
      message: message
    };

  } catch (error) {
    console.error('❌ Unexpected error in sendDeliveryNotification:', error);
    return {
      success: false,
      error: error.message,
      orderId: order.id,
      timestamp: new Date().toISOString(),
      status: 'failed'
    };
  }
};

/**
 * Test WhatsApp configuration by sending a test message
 * Useful for debugging and initial setup verification
 *
 * @param {string} testPhoneNumber - Phone number to send test message (with country code)
 * @returns {Promise<Object>} Result of test message
 */
export const sendTestMessage = async (testPhoneNumber) => {
  if (!isWhatsAppConfigured()) {
    return {
      success: false,
      error: 'WhatsApp not configured. Please check your .env file.'
    };
  }

  const testMessage = `🔧 Mensaje de prueba desde ${WHATSAPP_CONFIG.businessName}\n\nLa integración de WhatsApp está funcionando correctamente. ✅`;

  const formattedPhone = formatPhoneNumber(testPhoneNumber);
  return await sendWhatsAppMessage(formattedPhone, testMessage);
};

/**
 * Fallback to wa.me link (opens WhatsApp Web)
 * Use this when WhatsApp API is not configured or fails
 *
 * @param {Object} order - Order object
 * @returns {string} WhatsApp Web URL
 */
export const getWhatsAppWebLink = (order) => {
  const phone = formatPhoneNumber(order.phone);
  const message = buildDeliveryMessage(order);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

// Export configuration checker for UI components
export { isWhatsAppConfigured as default };
