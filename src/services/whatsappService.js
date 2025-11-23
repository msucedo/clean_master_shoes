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
  // Meta Template Configuration (for professional template messages)
  templateName: import.meta.env.VITE_WHATSAPP_TEMPLATE_NAME || '',
  trackingUrl: import.meta.env.VITE_ORDER_TRACKING_URL || '',
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
 * @returns {string} Formatted services list (single line for template compatibility)
 */
const formatServicesList = (services) => {
  if (!services || services.length === 0) {
    return 'Tu pedido';
  }

  // Use comma separation instead of newlines for WhatsApp template compatibility
  return services
    .map((service) => service.serviceName)
    .join(', ');
};

/**
 * Build order tracking URL for customer to track their order
 * @param {string} trackingToken - Order tracking token
 * @returns {string} Complete tracking URL or placeholder
 */
const buildOrderTrackingUrl = (trackingToken) => {
  if (!WHATSAPP_CONFIG.trackingUrl) {
    console.warn('⚠️ [WhatsApp] VITE_ORDER_TRACKING_URL no está configurado');
    return 'Solicita el enlace de rastreo a tu vendedor';
  }

  // Ensure URL ends with / before appending trackingToken
  const baseUrl = WHATSAPP_CONFIG.trackingUrl.endsWith('/')
    ? WHATSAPP_CONFIG.trackingUrl
    : `${WHATSAPP_CONFIG.trackingUrl}/`;

  return `${baseUrl}${trackingToken}`;
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

Servicios: ${servicesList}${addressInfo}

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
    // 📋 LOG: Request details antes de enviar
    console.log('📤 [WhatsApp] Enviando mensaje:', {
      timestamp: new Date().toISOString(),
      to: to,
      url: url,
      messageLength: message.length,
      payload: JSON.stringify(payload, null, 2)
    });

    const response = await axios.post(url, payload, config);

    // ✅ LOG: Success con detalles completos
    console.log('✅ [WhatsApp] Mensaje enviado exitosamente:', {
      messageId: response.data.messages[0].id,
      to: to,
      timestamp: new Date().toISOString(),
      statusCode: response.status,
      whatsappStatus: response.data.messages[0].message_status || 'sent'
    });

    return {
      success: true,
      messageId: response.data.messages[0].id,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
  } catch (error) {
    // ❌ LOG: Error detallado para debugging
    const errorDetails = {
      timestamp: new Date().toISOString(),
      to: to,
      httpStatus: error.response?.status,
      httpStatusText: error.response?.statusText,
      whatsappErrorCode: error.response?.data?.error?.code,
      whatsappErrorMessage: error.response?.data?.error?.message,
      whatsappErrorType: error.response?.data?.error?.type,
      errorDetail: error.response?.data?.error?.error_data?.details,
      fullError: error.response?.data || error.message,
      requestUrl: url,
      phoneNumber: to
    };

    console.error('❌ [WhatsApp] Error enviando mensaje:', errorDetails);
    console.error('📝 [WhatsApp] Mensaje que se intentó enviar:', message);

    // Return error details
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      errorCode: error.response?.data?.error?.code,
      errorType: error.response?.data?.error?.type,
      httpStatus: error.response?.status,
      timestamp: new Date().toISOString(),
      status: 'failed'
    };
  }
};

/**
 * Send WhatsApp template message using Meta approved templates
 * Template messages can be sent at any time (no 24-hour window restriction)
 *
 * @param {string} to - Recipient phone number (with country code)
 * @param {string} templateName - Name of the approved Meta template
 * @param {Array} components - Array of template components with parameters
 * @returns {Promise<Object>} API response with message ID and status
 */
const sendTemplateMessage = async (to, templateName, components) => {
  const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: templateName === 'orden_enproceso' ? 'en' : 'es_MX' // en for orden_enproceso, es_MX for others
      },
      components: components
    }
  };

  const config = {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    // 📋 LOG: Request details antes de enviar
    console.log('📤 [WhatsApp Template] Enviando mensaje con plantilla:', {
      timestamp: new Date().toISOString(),
      to: to,
      templateName: templateName,
      url: url,
      componentsCount: components.length,
      payload: JSON.stringify(payload, null, 2)
    });

    const response = await axios.post(url, payload, config);

    // ✅ LOG: Success con detalles completos
    console.log('✅ [WhatsApp Template] Mensaje enviado exitosamente:', {
      messageId: response.data.messages[0].id,
      to: to,
      templateName: templateName,
      timestamp: new Date().toISOString(),
      statusCode: response.status,
      whatsappStatus: response.data.messages[0].message_status || 'sent'
    });

    return {
      success: true,
      messageId: response.data.messages[0].id,
      timestamp: new Date().toISOString(),
      status: 'sent',
      templateUsed: templateName
    };
  } catch (error) {
    // ❌ LOG: Error detallado para debugging
    const errorDetails = {
      timestamp: new Date().toISOString(),
      to: to,
      templateName: templateName,
      httpStatus: error.response?.status,
      httpStatusText: error.response?.statusText,
      whatsappErrorCode: error.response?.data?.error?.code,
      whatsappErrorMessage: error.response?.data?.error?.message,
      whatsappErrorType: error.response?.data?.error?.type,
      errorDetail: error.response?.data?.error?.error_data?.details,
      fullError: error.response?.data || error.message,
      requestUrl: url,
      phoneNumber: to,
      componentsProvided: components.length
    };

    console.error('❌ [WhatsApp Template] Error enviando mensaje:', errorDetails);
    console.error('📝 [WhatsApp Template] Payload que se intentó enviar:', JSON.stringify(payload, null, 2));

    // Return error details
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      errorCode: error.response?.data?.error?.code,
      errorType: error.response?.data?.error?.type,
      httpStatus: error.response?.status,
      timestamp: new Date().toISOString(),
      status: 'failed',
      templateUsed: templateName
    };
  }
};

/**
 * Upload media (image) to WhatsApp Cloud API
 * Returns media_id that can be used to send the image
 *
 * @param {string} base64Image - Base64 encoded image (with data:image prefix)
 * @returns {Promise<Object>} Result with mediaId or error
 */
const uploadMediaToWhatsApp = async (base64Image) => {
  try {
    // Convertir base64 a Blob
    const base64Data = base64Image.split(',')[1]; // Quitar "data:image/jpeg;base64,"
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    // Crear FormData
    const formData = new FormData();
    formData.append('file', blob, 'order-image.jpg');
    formData.append('type', 'image/jpeg');
    formData.append('messaging_product', 'whatsapp');

    const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/media`;

    // 📤 LOG: Upload inicio
    console.log('📤 [WhatsApp Media] Subiendo imagen:', {
      timestamp: new Date().toISOString(),
      url: url,
      fileSize: blob.size,
      fileType: blob.type
    });

    const response = await axios.post(url, formData, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`
      }
    });

    // ✅ LOG: Upload exitoso
    console.log('✅ [WhatsApp Media] Imagen subida exitosamente:', {
      mediaId: response.data.id,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      mediaId: response.data.id,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    // ❌ LOG: Error en upload
    const errorDetails = {
      timestamp: new Date().toISOString(),
      httpStatus: error.response?.status,
      whatsappErrorCode: error.response?.data?.error?.code,
      whatsappErrorMessage: error.response?.data?.error?.message,
      fullError: error.response?.data || error.message
    };

    console.error('❌ [WhatsApp Media] Error subiendo imagen:', errorDetails);

    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      errorCode: error.response?.data?.error?.code,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Send image message using media_id from upload
 *
 * @param {string} to - Recipient phone number (with country code)
 * @param {string} mediaId - Media ID from uploadMediaToWhatsApp()
 * @param {string} caption - Optional caption for the image
 * @returns {Promise<Object>} API response with message ID and status
 */
const sendImageMessage = async (to, mediaId, caption = '') => {
  const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'image',
    image: {
      id: mediaId,
      caption: caption
    }
  };

  const config = {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    // 📤 LOG: Enviando imagen
    console.log('📤 [WhatsApp Image] Enviando imagen:', {
      timestamp: new Date().toISOString(),
      to: to,
      mediaId: mediaId,
      caption: caption,
      payload: JSON.stringify(payload, null, 2)
    });

    const response = await axios.post(url, payload, config);

    // ✅ LOG: Imagen enviada
    console.log('✅ [WhatsApp Image] Imagen enviada exitosamente:', {
      messageId: response.data.messages[0].id,
      to: to,
      timestamp: new Date().toISOString(),
      statusCode: response.status
    });

    return {
      success: true,
      messageId: response.data.messages[0].id,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

  } catch (error) {
    // ❌ LOG: Error enviando imagen
    const errorDetails = {
      timestamp: new Date().toISOString(),
      to: to,
      mediaId: mediaId,
      httpStatus: error.response?.status,
      whatsappErrorCode: error.response?.data?.error?.code,
      whatsappErrorMessage: error.response?.data?.error?.message,
      fullError: error.response?.data || error.message
    };

    console.error('❌ [WhatsApp Image] Error enviando imagen:', errorDetails);

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
  // 📋 LOG: Inicio del proceso de notificación
  console.log('🔔 [WhatsApp] Iniciando envío de notificación de entrega:', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    client: order.client,
    phone: order.phone
  });

  // Check if WhatsApp is configured
  if (!isWhatsAppConfigured()) {
    console.warn('⚠️ [WhatsApp] WhatsApp no está configurado. Saltando notificación.');
    return {
      success: false,
      error: 'WhatsApp not configured',
      skipped: true
    };
  }

  // Validate order has required fields
  if (!order.client || !order.phone) {
    console.error('❌ [WhatsApp] Orden sin campos requeridos:', {
      orderId: order.id,
      hasClient: !!order.client,
      hasPhone: !!order.phone
    });
    return {
      success: false,
      error: 'Missing client name or phone number'
    };
  }

  try {
    // Format phone number
    console.log('📞 [WhatsApp] Formateando número:', { original: order.phone });
    const formattedPhone = formatPhoneNumber(order.phone);
    console.log('📞 [WhatsApp] Número formateado:', { formatted: formattedPhone });

    if (!formattedPhone) {
      throw new Error('Invalid phone number format');
    }

    // Check if template is configured (professional template mode)
    if (WHATSAPP_CONFIG.templateName) {
      console.log('✨ [WhatsApp] Usando plantilla de Meta:', WHATSAPP_CONFIG.templateName);

      // Build template parameters
      // Template variables (según WHATSAPP_TEMPLATE_IMPLEMENTATION.md):
      // {{1}} = Nombre del cliente
      // {{2}} = Número de orden
      // {{3}} = Lista de servicios completados
      // {{4}} = Dirección del negocio
      // {{5}} = URL para rastrear la orden

      const servicesList = formatServicesList(order.services);
      const orderNumber = order.orderNumber || order.id;
      const businessAddress = WHATSAPP_CONFIG.businessAddress || 'Ubicación no configurada';
      const trackingUrl = buildOrderTrackingUrl(order.trackingToken);

      const components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: order.client },           // {{1}} Nombre
            { type: 'text', text: orderNumber },            // {{2}} Número orden
            { type: 'text', text: servicesList },           // {{3}} Servicios
            { type: 'text', text: businessAddress },        // {{4}} Dirección
            { type: 'text', text: trackingUrl }             // {{5}} URL rastreo
          ]
        }
      ];

      console.log('📋 [WhatsApp] Parámetros de plantilla:', {
        cliente: order.client,
        orden: orderNumber,
        servicios: servicesList,
        direccion: businessAddress,
        trackingUrl: trackingUrl
      });

      // Send template message
      const result = await sendTemplateMessage(
        formattedPhone,
        WHATSAPP_CONFIG.templateName,
        components
      );

      // Build the complete template message for display in conversation
      const templateMessage = `¡Hola ${order.client}! 👋

Tu orden #${orderNumber} está lista para recoger 🎉

⏰ Horario:
Lunes - Viernes 10:00 am - 6:00 pm
Sabados 10:00 am - 4:00 pm

📦 Servicios: ${servicesList}

📍 Te esperamos en: ${businessAddress}

🔍 Rastrea tu orden aquí: ${trackingUrl}

¡Gracias por tu confianza!
- Clean Master Shoes`;

      // Return result with additional order context
      return {
        ...result,
        orderId: order.id,
        orderNumber: orderNumber,
        clientName: order.client,
        phone: formattedPhone,
        message: templateMessage,
        usingTemplate: true
      };

    } else {
      // Fallback: usar texto libre (requiere ventana de 24 horas)
      console.log('📝 [WhatsApp] Plantilla no configurada, usando texto libre (fallback)');

      const message = buildDeliveryMessage(order);
      console.log('📝 [WhatsApp] Mensaje construido, longitud:', message.length);

      // Send message via WhatsApp API
      const result = await sendWhatsAppMessage(formattedPhone, message);

      // Return result with additional order context
      return {
        ...result,
        orderId: order.id,
        orderNumber: order.orderNumber,
        clientName: order.client,
        phone: formattedPhone,
        message: message,
        usingTemplate: false
      };
    }

  } catch (error) {
    console.error('❌ [WhatsApp] Error inesperado en sendDeliveryNotification:', {
      error: error.message,
      stack: error.stack,
      orderId: order.id,
      orderNumber: order.orderNumber
    });
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
 * Send "Order Received" notification with image
 * Sends 2 messages:
 *   1. Template message with order details
 *   2. Image of the order (first image)
 *
 * @param {Object} order - Order object with all details
 * @returns {Promise<Object>} Result with both message statuses
 */
export const sendOrderReceivedNotification = async (order) => {
  // 📋 LOG: Inicio del proceso de notificación
  console.log('🔔 [WhatsApp] Iniciando envío de notificación orden recibida:', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    client: order.client,
    phone: order.phone,
    hasImages: order.orderImages?.length > 0
  });

  // Check if WhatsApp is configured
  if (!isWhatsAppConfigured()) {
    console.warn('⚠️ [WhatsApp] WhatsApp no está configurado. Saltando notificación.');
    return {
      success: false,
      error: 'WhatsApp not configured',
      skipped: true
    };
  }

  // Validate order has required fields
  if (!order.client || !order.phone) {
    console.error('❌ [WhatsApp] Orden sin campos requeridos:', {
      orderId: order.id,
      hasClient: !!order.client,
      hasPhone: !!order.phone
    });
    return {
      success: false,
      error: 'Missing client name or phone number'
    };
  }

  try {
    // Format phone number
    console.log('📞 [WhatsApp] Formateando número:', { original: order.phone });
    const formattedPhone = formatPhoneNumber(order.phone);
    console.log('📞 [WhatsApp] Número formateado:', { formatted: formattedPhone });

    if (!formattedPhone) {
      throw new Error('Invalid phone number format');
    }

    // Build template parameters
    const servicesList = formatServicesList(order.services);
    const orderNumber = order.orderNumber || order.id;

    console.log('✨ [WhatsApp] Usando plantilla de Meta:', 'orden_enproceso');

    // Construir componentes del template
    // Body: 3 parámetros ({{1}} nombre, {{2}} orden, {{3}} servicios)
    // Button: 1 parámetro ({{1}} trackingToken para URL)
    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: order.client },           // {{1}} Nombre
          { type: 'text', text: orderNumber },            // {{2}} Número orden
          { type: 'text', text: servicesList }            // {{3}} Servicios
        ]
      },
      {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [
          { type: 'text', text: order.trackingToken }     // {{1}} en botón URL
        ]
      }
    ];

    console.log('📋 [WhatsApp] Parámetros de plantilla:', {
      cliente: order.client,
      orden: orderNumber,
      servicios: servicesList,
      trackingToken: order.trackingToken
    });

    // MENSAJE 1: Send template message
    const templateResult = await sendTemplateMessage(
      formattedPhone,
      'orden_enproceso',
      components
    );

    // Build the complete template message for display in conversation
    const templateMessage = `¡Hola ${order.client}! 👋

Tu orden #${orderNumber} está en proceso🎉

📦 Servicios a trabajar: ${servicesList}

🔍 Selecciona el botón inferior para rastrear tu orden

¡Gracias por tu confianza!
- Clean Master Shoes`;

    // MENSAJE 2: Send image (SOLO si template fue exitoso)
    let imageResult = null;
    if (templateResult.success && order.orderImages && order.orderImages.length > 0) {
      try {
        console.log('📸 [WhatsApp] Preparando envío de imagen...');
        const firstImage = order.orderImages[0];

        // Upload image to WhatsApp
        const uploadResult = await uploadMediaToWhatsApp(firstImage);

        if (uploadResult.success) {
          // Send image message
          imageResult = await sendImageMessage(
            formattedPhone,
            uploadResult.mediaId,
            '📸 Foto de su orden'
          );
        } else {
          console.error('❌ [WhatsApp] Error subiendo imagen:', uploadResult.error);
        }
      } catch (imageError) {
        console.error('❌ [WhatsApp] Error en proceso de imagen:', imageError);
        // No bloquear si falla la imagen
      }
    } else if (!templateResult.success && order.orderImages && order.orderImages.length > 0) {
      console.warn('⚠️ [WhatsApp] Template falló, saltando envío de imagen');
    }

    // Return result with additional order context
    return {
      ...templateResult,
      imageResult: imageResult,
      orderId: order.id,
      orderNumber: orderNumber,
      clientName: order.client,
      phone: formattedPhone,
      message: templateMessage,
      usingTemplate: true
    };

  } catch (error) {
    console.error('❌ [WhatsApp] Error inesperado en sendOrderReceivedNotification:', {
      error: error.message,
      stack: error.stack,
      orderId: order.id,
      orderNumber: order.orderNumber
    });
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
