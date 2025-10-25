/**
 * Vercel Serverless Function - WhatsApp Webhook
 *
 * Este endpoint recibe webhooks de WhatsApp Business API cuando:
 * - Un cliente responde a un mensaje
 * - Se actualiza el estado de un mensaje enviado
 *
 * Configuración requerida en Meta:
 * 1. Webhook URL: https://tu-dominio.vercel.app/api/whatsapp-webhook
 * 2. Verify Token: debe coincidir con VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN en .env
 * 3. Suscripciones: messages, message_status
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (solo si no está inicializado)
if (!getApps().length) {
  // En producción, Vercel cargará las credenciales desde variables de entorno
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );

  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

/**
 * Verificar la firma del webhook de Meta
 * @param {string} signature - Signature header de la petición
 * @param {string} body - Body crudo de la petición
 * @returns {boolean}
 */
function verifyWebhookSignature(signature, body) {
  const crypto = require('crypto');
  const appSecret = process.env.VITE_WHATSAPP_APP_SECRET;

  if (!appSecret) {
    console.warn('⚠️ VITE_WHATSAPP_APP_SECRET not configured');
    return true; // En desarrollo, permitir sin verificación
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(body)
    .digest('hex');

  return signature === expectedSignature;
}

/**
 * Buscar orden por número de teléfono
 * @param {string} phoneNumber - Número de teléfono del cliente
 * @returns {Promise<Object|null>} Orden encontrada o null
 */
async function findOrderByPhone(phoneNumber) {
  try {
    // Limpiar número de teléfono (quitar +, espacios, etc)
    const cleanedPhone = phoneNumber.replace(/\D/g, '');

    console.log('🔍 Buscando orden para teléfono:', cleanedPhone);

    // Buscar en todas las órdenes activas
    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef.get();

    let matchingOrder = null;
    let bestMatchScore = 0;

    snapshot.forEach(doc => {
      const order = { id: doc.id, ...doc.data() };

      // Solo considerar órdenes no completadas ni canceladas
      if (order.orderStatus === 'completados' || order.orderStatus === 'cancelado') {
        return;
      }

      if (!order.phone) return;

      const orderPhone = order.phone.replace(/\D/g, '');

      // Comparar últimos 10 dígitos (número local sin código de país)
      const last10Incoming = cleanedPhone.slice(-10);
      const last10Order = orderPhone.slice(-10);

      if (last10Incoming === last10Order) {
        // Preferir órdenes más recientes
        const createdAt = new Date(order.createdAt || 0);
        const score = createdAt.getTime();

        if (score > bestMatchScore) {
          bestMatchScore = score;
          matchingOrder = order;
        }
      }
    });

    if (matchingOrder) {
      console.log('✅ Orden encontrada:', matchingOrder.id, matchingOrder.orderNumber);
    } else {
      console.log('❌ No se encontró orden para este número');
    }

    return matchingOrder;

  } catch (error) {
    console.error('❌ Error buscando orden:', error);
    return null;
  }
}

/**
 * Guardar mensaje entrante en la orden
 * @param {string} orderId - ID de la orden
 * @param {Object} messageData - Datos del mensaje
 */
async function saveIncomingMessage(orderId, messageData) {
  try {
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      console.error('❌ Orden no encontrada:', orderId);
      return;
    }

    const currentData = orderDoc.data();
    const existingNotifications = currentData.whatsappNotifications || [];

    // Agregar nuevo mensaje entrante
    const newNotification = {
      type: 'received',
      direction: 'incoming',
      from: messageData.from,
      message: messageData.text,
      messageId: messageData.messageId,
      timestamp: messageData.timestamp,
      receivedAt: new Date().toISOString()
    };

    await orderRef.update({
      whatsappNotifications: [...existingNotifications, newNotification]
    });

    console.log('✅ Mensaje guardado en orden:', orderId);

  } catch (error) {
    console.error('❌ Error guardando mensaje:', error);
  }
}

/**
 * Handler principal del webhook
 */
export default async function handler(req, res) {
  const method = req.method;

  console.log(`📥 [Webhook] ${method} request received`);

  // GET: Verificación inicial del webhook por Meta
  if (method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔐 [Webhook] Verification request:', { mode, token });

    const verifyToken = process.env.VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'your_verify_token_here';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ [Webhook] Verification successful');
      return res.status(200).send(challenge);
    } else {
      console.log('❌ [Webhook] Verification failed');
      return res.status(403).send('Forbidden');
    }
  }

  // POST: Recibir mensajes/actualizaciones
  if (method === 'POST') {
    try {
      // Verificar firma de Meta (seguridad)
      const signature = req.headers['x-hub-signature-256'];
      const rawBody = JSON.stringify(req.body);

      if (!verifyWebhookSignature(signature, rawBody)) {
        console.error('❌ [Webhook] Invalid signature');
        return res.status(401).send('Unauthorized');
      }

      const body = req.body;

      console.log('📨 [Webhook] Payload:', JSON.stringify(body, null, 2));

      // Extraer mensajes del webhook
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            if (change.field === 'messages') {
              const value = change.value;

              // Procesar mensajes entrantes
              if (value.messages) {
                for (const message of value.messages) {
                  console.log('💬 [Webhook] Incoming message:', message);

                  // Solo procesar mensajes de texto por ahora
                  if (message.type === 'text') {
                    const from = message.from; // Número del cliente
                    const text = message.text.body;
                    const messageId = message.id;
                    const timestamp = message.timestamp;

                    console.log('📞 From:', from);
                    console.log('📝 Message:', text);

                    // Buscar la orden asociada a este número
                    const order = await findOrderByPhone(from);

                    if (order) {
                      await saveIncomingMessage(order.id, {
                        from,
                        text,
                        messageId,
                        timestamp: new Date(parseInt(timestamp) * 1000).toISOString()
                      });
                    } else {
                      console.log('⚠️ No se encontró orden para este número');
                    }
                  }
                }
              }

              // También podemos procesar actualizaciones de estado (delivered, read, etc)
              if (value.statuses) {
                for (const status of value.statuses) {
                  console.log('📊 [Webhook] Message status update:', status);
                  // Aquí podrías actualizar el estado de mensajes enviados
                  // Por ejemplo: marcar como "delivered", "read", etc.
                }
              }
            }
          }
        }
      }

      // Siempre responder 200 OK a Meta
      return res.status(200).json({ success: true });

    } catch (error) {
      console.error('❌ [Webhook] Error processing:', error);
      // Aún así responder 200 para que Meta no reintente
      return res.status(200).json({ success: false, error: error.message });
    }
  }

  // Método no soportado
  return res.status(405).send('Method Not Allowed');
}
