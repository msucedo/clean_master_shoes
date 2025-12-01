import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  getDocFromServer,
  query,
  onSnapshot,
  orderBy,
  where,
  runTransaction,
  setDoc,
  arrayUnion,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { sendDeliveryNotification, sendOrderReceivedNotification } from './whatsappService';

// ==================== TRACKING TOKEN ====================

/**
 * Generate a unique tracking token for order tracking
 * Creates an 8-character alphanumeric token that's URL-safe and hard to guess
 * @returns {string} Unique tracking token
 */
export const generateTrackingToken = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';

  // Generate 8 random characters
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Add timestamp-based component for uniqueness
  const timestamp = Date.now().toString(36).slice(-4);

  return `${token}${timestamp}`;
};

// ==================== ORDERS ====================

/**
 * Get all orders organized by status
 * @returns {Promise<Object>} Orders organized by status columns
 */
export const getAllOrders = async () => {
  try {
    const ordersRef = collection(db, 'orders');
    const querySnapshot = await getDocs(ordersRef);

    const orders = {
      recibidos: [],
      proceso: [],
      listos: [],
      enEntrega: [],
      completados: [],
      cancelado: []
    };

    querySnapshot.forEach((doc) => {
      const orderData = { id: doc.id, ...doc.data() };
      const status = orderData.orderStatus || 'recibidos';

      if (orders[status]) {
        orders[status].push(orderData);
      }
    });

    return orders;
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time orders updates
 * @param {Function} callback - Function to call when orders change
 * @returns {Function} Unsubscribe function
 */
export const subscribeToOrders = (callback) => {
  try {
    const ordersRef = collection(db, 'orders');

    return onSnapshot(ordersRef, (snapshot) => {
      const orders = {
        recibidos: [],
        proceso: [],
        listos: [],
        enEntrega: [],
        completados: [],
        cancelado: []
      };

      snapshot.forEach((doc) => {
        const orderData = { id: doc.id, ...doc.data() };
        const status = orderData.orderStatus || 'recibidos';

        if (orders[status]) {
          orders[status].push(orderData);
        }
      });

      callback(orders);
    }, (error) => {
      console.error('Error in orders subscription:', error);
    });
  } catch (error) {
    console.error('Error subscribing to orders:', error);
    throw error;
  }
};

/**
 * Add a new order
 * @param {Object} orderData - Order data
 * @returns {Promise<string>} Document ID of the created order
 */
export const addOrder = async (orderData) => {
  try {
    // DETERMINAR ESTADO INICIAL DINÁMICAMENTE
    const hasServices = orderData.services && orderData.services.length > 0;
    const isWithoutServices = orderData.isOrderWithoutServices === true;
    const isPaid = orderData.paymentStatus === 'paid';

    let initialStatus = 'recibidos';  // Por defecto

    // REGLA: Solo órdenes SIN servicios Y pagadas completas van a "completados"
    if (!hasServices && isWithoutServices && isPaid) {
      initialStatus = 'completados';
    }

    // Limpiar flag temporal antes de guardar
    const { isOrderWithoutServices, ...cleanOrderData } = orderData;

    // Si hay productos en la orden, usar transacción para garantizar atomicidad
    if (orderData.products && orderData.products.length > 0) {
      const orderId = await runTransaction(db, async (transaction) => {
        // 1. Verificar stock disponible para todos los productos
        const productRefs = [];
        const productDocs = [];

        for (const product of orderData.products) {
          const productRef = doc(db, 'inventory', product.productId);
          const productDoc = await transaction.get(productRef);

          if (!productDoc.exists()) {
            throw new Error(`Producto ${product.name} no encontrado en inventario`);
          }

          const currentStock = productDoc.data().stock || 0;
          if (currentStock < product.quantity) {
            throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${currentStock}, Solicitado: ${product.quantity}`);
          }

          productRefs.push(productRef);
          productDocs.push(productDoc);
        }

        // 2. Crear la orden
        const ordersRef = collection(db, 'orders');
        const orderRef = doc(ordersRef);
        const trackingToken = generateTrackingToken();
        transaction.set(orderRef, {
          ...cleanOrderData,
          orderStatus: initialStatus,
          trackingToken: trackingToken,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // 2.5 Agregar id y completedDate al documento
        const updateData = { id: orderRef.id };
        if (initialStatus === 'completados') {
          updateData.completedDate = new Date().toISOString();
        }
        transaction.update(orderRef, updateData);

        // 3. Descontar stock de todos los productos
        orderData.products.forEach((product, index) => {
          const currentStock = productDocs[index].data().stock;
          const newStock = currentStock - product.quantity;

          transaction.update(productRefs[index], {
            stock: newStock,
            updatedAt: new Date().toISOString()
          });
        });

        return orderRef.id;
      });

      // ==================== WHATSAPP: ORDEN RECIBIDA CON FOTO ====================
      // Enviar notificación WhatsApp si la orden tiene fotos Y servicios (después de la transacción)
      const orderImages = cleanOrderData.orderImages;
      const whatsappPhone = cleanOrderData.phone;
      const hasServices = cleanOrderData.services && cleanOrderData.services.length > 0;

      if (hasServices && orderImages && orderImages.length > 0 && whatsappPhone) {
        // Necesitamos obtener el trackingToken que se generó en la transacción
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        const orderDataFromDb = orderDoc.data();

        const newOrderWithId = {
          id: orderId,
          ...orderDataFromDb
        };

        try {
          const orderReceivedResult = await sendOrderReceivedNotification(newOrderWithId);

          // Actualizar documento con historial de WhatsApp
          if (orderReceivedResult.success) {
            console.log('✅ [Firebase] Notificación orden recibida enviada exitosamente');

            const newNotifications = [];

            // Agregar mensaje 1: Template
            newNotifications.push({
              type: 'template_order_received',
              sentAt: orderReceivedResult.timestamp,
              status: orderReceivedResult.status,
              messageId: orderReceivedResult.messageId,
              message: orderReceivedResult.message
            });

            // Agregar mensaje 2: Imagen (si se envió exitosamente)
            if (orderReceivedResult.imageResult && orderReceivedResult.imageResult.success) {
              newNotifications.push({
                type: 'image_order_received',
                sentAt: orderReceivedResult.imageResult.timestamp,
                status: orderReceivedResult.imageResult.status,
                messageId: orderReceivedResult.imageResult.messageId,
                message: '📸 Foto de su orden'
              });
            }

            await updateDoc(doc(db, 'orders', orderId), {
              whatsappNotifications: newNotifications
            });
          } else if (!orderReceivedResult.skipped) {
            console.error('❌ [Firebase] Error enviando notificación orden recibida:', orderReceivedResult.error);

            // Registrar error en historial
            const failedNotifications = [{
              type: 'template_order_received',
              sentAt: orderReceivedResult.timestamp,
              status: 'failed',
              error: orderReceivedResult.error,
              errorCode: orderReceivedResult.errorCode
            }];

            // Agregar resultado de imagen (exitosa o fallida)
            if (orderReceivedResult.imageResult) {
              if (orderReceivedResult.imageResult.success) {
                failedNotifications.push({
                  type: 'image_order_received',
                  sentAt: orderReceivedResult.imageResult.timestamp,
                  status: orderReceivedResult.imageResult.status,
                  messageId: orderReceivedResult.imageResult.messageId,
                  message: '📸 Foto de su orden'
                });
              } else {
                failedNotifications.push({
                  type: 'image_order_received',
                  sentAt: orderReceivedResult.imageResult.timestamp,
                  status: 'failed',
                  error: orderReceivedResult.imageResult.error,
                  errorCode: orderReceivedResult.imageResult.errorCode
                });
              }
            }

            await updateDoc(doc(db, 'orders', orderId), {
              whatsappNotifications: failedNotifications
            });
          }
        } catch (error) {
          console.error('❌ [Firebase] Error inesperado enviando notificación WhatsApp:', error);
          // No bloquear la creación de la orden si falla WhatsApp
        }
      }

      return orderId;
    } else {
      // Si no hay productos, crear orden normalmente
      const ordersRef = collection(db, 'orders');
      const trackingToken = generateTrackingToken();
      const docRef = await addDoc(ordersRef, {
        ...cleanOrderData,
        orderStatus: initialStatus,
        trackingToken: trackingToken,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Agregar id al documento
      await updateDoc(docRef, {
        id: docRef.id
      });

      // ==================== WHATSAPP: ORDEN RECIBIDA CON FOTO ====================
      // Enviar notificación WhatsApp si la orden tiene fotos Y servicios
      const orderImages = cleanOrderData.orderImages;
      const whatsappPhone = cleanOrderData.phone;
      const hasServices = cleanOrderData.services && cleanOrderData.services.length > 0;

      if (hasServices && orderImages && orderImages.length > 0 && whatsappPhone) {
        // Construir objeto completo de la orden para WhatsApp
        const newOrderWithId = {
          id: docRef.id,
          ...cleanOrderData,
          orderStatus: initialStatus,
          trackingToken: trackingToken
        };

        try {
          const orderReceivedResult = await sendOrderReceivedNotification(newOrderWithId);

          // Actualizar documento con historial de WhatsApp
          if (orderReceivedResult.success) {
            console.log('✅ [Firebase] Notificación orden recibida enviada exitosamente');

            const newNotifications = [];

            // Agregar mensaje 1: Template
            newNotifications.push({
              type: 'template_order_received',
              sentAt: orderReceivedResult.timestamp,
              status: orderReceivedResult.status,
              messageId: orderReceivedResult.messageId,
              message: orderReceivedResult.message
            });

            // Agregar mensaje 2: Imagen (si se envió exitosamente)
            if (orderReceivedResult.imageResult && orderReceivedResult.imageResult.success) {
              newNotifications.push({
                type: 'image_order_received',
                sentAt: orderReceivedResult.imageResult.timestamp,
                status: orderReceivedResult.imageResult.status,
                messageId: orderReceivedResult.imageResult.messageId,
                message: '📸 Foto de su orden'
              });
            }

            await updateDoc(docRef, {
              whatsappNotifications: newNotifications
            });
          } else if (!orderReceivedResult.skipped) {
            console.error('❌ [Firebase] Error enviando notificación orden recibida:', orderReceivedResult.error);

            // Registrar error en historial
            const failedNotifications = [{
              type: 'template_order_received',
              sentAt: orderReceivedResult.timestamp,
              status: 'failed',
              error: orderReceivedResult.error,
              errorCode: orderReceivedResult.errorCode
            }];

            // Agregar resultado de imagen (exitosa o fallida)
            if (orderReceivedResult.imageResult) {
              if (orderReceivedResult.imageResult.success) {
                failedNotifications.push({
                  type: 'image_order_received',
                  sentAt: orderReceivedResult.imageResult.timestamp,
                  status: orderReceivedResult.imageResult.status,
                  messageId: orderReceivedResult.imageResult.messageId,
                  message: '📸 Foto de su orden'
                });
              } else {
                failedNotifications.push({
                  type: 'image_order_received',
                  sentAt: orderReceivedResult.imageResult.timestamp,
                  status: 'failed',
                  error: orderReceivedResult.imageResult.error,
                  errorCode: orderReceivedResult.imageResult.errorCode
                });
              }
            }

            await updateDoc(docRef, {
              whatsappNotifications: failedNotifications
            });
          }
        } catch (error) {
          console.error('❌ [Firebase] Error inesperado enviando notificación WhatsApp:', error);
          // No bloquear la creación de la orden si falla WhatsApp
        }
      }

      return docRef.id;
    }
  } catch (error) {
    console.error('Error adding order:', error);
    throw error;
  }
};

/**
 * Update an existing order
 * Automatically sends WhatsApp notification when status changes to "enEntrega"
 * @param {string} orderId - Order document ID
 * @param {Object} orderData - Updated order data
 * @returns {Promise<Object>} Result object with whatsapp info if status changed to enEntrega
 */
export const updateOrder = async (orderId, orderData) => {
  try {
    const orderRef = doc(db, 'orders', orderId);

    // Get current order data to check if status changed
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const currentOrderData = orderDoc.data();
    const currentStatus = currentOrderData.orderStatus;
    const newStatus = orderData.orderStatus;

    // Check if status is changing to "enEntrega"
    const statusChangingToEntrega = newStatus === 'enEntrega' && currentStatus !== 'enEntrega';

    // Check if status is changing to "cancelado"
    const statusChangingToCancelado = newStatus === 'cancelado' && currentStatus !== 'cancelado';

    let whatsappResult = null;
    let updateData = {
      ...orderData,
      updatedAt: new Date().toISOString()
    };

    // If cancelling order with pending payment, update payment status
    if (statusChangingToCancelado && currentOrderData.paymentStatus === 'pending') {
      updateData.paymentStatus = 'cancelled';
    }

    if (statusChangingToEntrega) {
      // Prepare complete order data for WhatsApp notification
      const completeOrderData = {
        id: orderId,
        ...currentOrderData,
        ...orderData
      };

      console.log('📱 [Firebase] Status changing to enEntrega, sending WhatsApp notification...');
      whatsappResult = await sendDeliveryNotification(completeOrderData);

      // Add WhatsApp notification to the notifications array
      if (whatsappResult.success) {
        console.log('✅ [Firebase] WhatsApp notification sent successfully');

        const existingNotifications = currentOrderData.whatsappNotifications || [];

        updateData.whatsappNotifications = [
          ...existingNotifications,
          {
            sentAt: whatsappResult.timestamp,
            status: whatsappResult.status,
            messageId: whatsappResult.messageId,
            message: whatsappResult.message
          }
        ];
      } else if (!whatsappResult.skipped) {
        // Only log errors if it wasn't skipped due to configuration
        console.error('❌ [Firebase] WhatsApp notification failed:', whatsappResult.error);

        const existingNotifications = currentOrderData.whatsappNotifications || [];

        updateData.whatsappNotifications = [
          ...existingNotifications,
          {
            sentAt: whatsappResult.timestamp,
            status: 'failed',
            error: whatsappResult.error,
            errorCode: whatsappResult.errorCode,
            errorType: whatsappResult.errorType
          }
        ];
      }
    }

    // ==================== WHATSAPP: DETECTAR PRIMERA FOTO AGREGADA ====================
    // Detectar si se agregó la primera foto a una orden existente
    const oldImages = currentOrderData.orderImages || [];
    const newImages = orderData.orderImages || [];
    const isFirstImageAdded = oldImages.length === 0 && newImages.length > 0;

    let orderReceivedResult = null;

    // Solo enviar si tiene servicios Y es primera foto agregada
    const completeOrderData = {
      id: orderId,
      ...currentOrderData,
      ...orderData
    };
    const hasServices = completeOrderData.services && completeOrderData.services.length > 0;

    if (isFirstImageAdded && hasServices) {
      console.log('📱 [Firebase] Primera foto agregada, enviando notificación orden recibida...');
      orderReceivedResult = await sendOrderReceivedNotification(completeOrderData);

      // Add WhatsApp notifications to the notifications array
      if (orderReceivedResult.success) {
        console.log('✅ [Firebase] Notificación orden recibida enviada exitosamente');

        const existingNotifications = currentOrderData.whatsappNotifications || [];
        const newNotifications = [...existingNotifications];

        // Agregar mensaje 1: Template
        newNotifications.push({
          type: 'template_order_received',
          sentAt: orderReceivedResult.timestamp,
          status: orderReceivedResult.status,
          messageId: orderReceivedResult.messageId,
          message: orderReceivedResult.message
        });

        // Agregar mensaje 2: Imagen (si se envió exitosamente)
        if (orderReceivedResult.imageResult && orderReceivedResult.imageResult.success) {
          newNotifications.push({
            type: 'image_order_received',
            sentAt: orderReceivedResult.imageResult.timestamp,
            status: orderReceivedResult.imageResult.status,
            messageId: orderReceivedResult.imageResult.messageId,
            message: '📸 Foto de su orden'
          });
        }

        updateData.whatsappNotifications = newNotifications;

      } else if (!orderReceivedResult.skipped) {
        // Only log errors if it wasn't skipped due to configuration
        console.error('❌ [Firebase] Notificación orden recibida falló:', orderReceivedResult.error);

        const existingNotifications = currentOrderData.whatsappNotifications || [];
        const failedNotifications = [
          {
            type: 'template_order_received',
            sentAt: orderReceivedResult.timestamp,
            status: 'failed',
            error: orderReceivedResult.error,
            errorCode: orderReceivedResult.errorCode
          }
        ];

        // Agregar resultado de imagen (exitosa o fallida)
        if (orderReceivedResult.imageResult) {
          if (orderReceivedResult.imageResult.success) {
            failedNotifications.push({
              type: 'image_order_received',
              sentAt: orderReceivedResult.imageResult.timestamp,
              status: orderReceivedResult.imageResult.status,
              messageId: orderReceivedResult.imageResult.messageId,
              message: '📸 Foto de su orden'
            });
          } else {
            failedNotifications.push({
              type: 'image_order_received',
              sentAt: orderReceivedResult.imageResult.timestamp,
              status: 'failed',
              error: orderReceivedResult.imageResult.error,
              errorCode: orderReceivedResult.imageResult.errorCode
            });
          }
        }

        updateData.whatsappNotifications = [
          ...existingNotifications,
          ...failedNotifications
        ];
      }
    }

    // Update the order
    await updateDoc(orderRef, updateData);

    // Return result with WhatsApp info if applicable
    return {
      success: true,
      whatsappResult: whatsappResult,
      orderReceivedResult: orderReceivedResult
    };

  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

/**
 * Delete an order
 * @param {string} orderId - Order document ID
 */
export const deleteOrder = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await deleteDoc(orderRef);
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

/**
 * Get order by ID
 * @param {string} orderId - Order document ID
 * @returns {Promise<Object|null>} Full order data or null if not found
 */
export const getOrderById = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      console.warn('Order not found:', orderId);
      return null;
    }

    return {
      id: orderSnap.id,
      ...orderSnap.data()
    };
  } catch (error) {
    console.error('Error getting order by ID:', error);
    return null;
  }
};

/**
 * Get order by tracking token (PUBLIC - no authentication required)
 * Used for public order tracking page
 * @param {string} token - Tracking token
 * @returns {Promise<Object|null>} Order data with only public fields, or null if not found
 */
export const getOrderByTrackingToken = async (token) => {
  try {
    // Validate token format
    if (!token || typeof token !== 'string') {
      console.error('[OrderTracking] Invalid token type:', typeof token);
      return null;
    }

    // Token should be 12 characters: 8 random + 4 timestamp
    if (token.length < 8 || token.length > 15) {
      console.error('[OrderTracking] Invalid token length:', token.length);
      return null;
    }

    // Token should only contain alphanumeric characters
    if (!/^[a-z0-9]+$/i.test(token)) {
      console.error('[OrderTracking] Invalid token format - contains invalid characters');
      return null;
    }

    console.log('[OrderTracking] Querying order with token:', token);

    // Create query with timeout
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('trackingToken', '==', token));

    // Race between query and timeout (10 seconds)
    const queryPromise = getDocs(q);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 10000)
    );

    const querySnapshot = await Promise.race([queryPromise, timeoutPromise]);

    if (querySnapshot.empty) {
      console.log('[OrderTracking] No order found with token:', token);
      return null;
    }

    // Get first matching order (tokens should be unique)
    const orderDoc = querySnapshot.docs[0];
    const orderData = { id: orderDoc.id, ...orderDoc.data() };

    console.log('[OrderTracking] Order found:', orderData.orderNumber);

    // Return only public-safe fields (filter out sensitive info)
    return {
      id: orderData.id,
      orderNumber: orderData.orderNumber,
      client: orderData.client,
      phone: orderData.phone,
      orderStatus: orderData.orderStatus,
      deliveryDate: orderData.deliveryDate,
      services: orderData.services,
      shoePairs: orderData.shoePairs,
      otherItems: orderData.otherItems,
      products: orderData.products,
      photos: orderData.photos,
      totalPrice: orderData.totalPrice,
      advancePayment: orderData.advancePayment,
      paymentStatus: orderData.paymentStatus,
      paymentMethod: orderData.paymentMethod,
      priority: orderData.priority,
      createdAt: orderData.createdAt,
      updatedAt: orderData.updatedAt,
      // Exclude sensitive fields like: employee notes, internal costs, etc.
    };
  } catch (error) {
    console.error('Error getting order by tracking token:', error);
    throw error;
  }
};


// ==================== SERVICES ====================

/**
 * Get all services
 * @returns {Promise<Array>} Array of services
 */
export const getAllServices = async () => {
  try {
    const servicesRef = collection(db, 'services');
    const querySnapshot = await getDocs(servicesRef);

    const services = [];
    querySnapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() });
    });

    return services;
  } catch (error) {
    console.error('Error getting services:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time services updates
 * @param {Function} callback - Function to call when services change
 * @returns {Function} Unsubscribe function
 */
export const subscribeToServices = (callback) => {
  try {
    const servicesRef = collection(db, 'services');

    return onSnapshot(servicesRef, (snapshot) => {
      const services = [];
      snapshot.forEach((doc) => {
        services.push({ id: doc.id, ...doc.data() });
      });
      callback(services);
    }, (error) => {
      console.error('Error in services subscription:', error);
    });
  } catch (error) {
    console.error('Error subscribing to services:', error);
    throw error;
  }
};

/**
 * Add a new service
 * @param {Object} serviceData - Service data
 * @returns {Promise<string>} Document ID of the created service
 */
export const addService = async (serviceData) => {
  try {
    const servicesRef = collection(db, 'services');
    const docRef = await addDoc(servicesRef, {
      ...serviceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding service:', error);
    throw error;
  }
};

/**
 * Update an existing service
 * @param {string} serviceId - Service document ID
 * @param {Object} serviceData - Updated service data
 */
export const updateService = async (serviceId, serviceData) => {
  try {
    const serviceRef = doc(db, 'services', serviceId);
    await updateDoc(serviceRef, {
      ...serviceData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

/**
 * Check if a service can be deleted (not referenced in active orders)
 * @param {string} serviceId - Service document ID
 * @returns {Promise<{canDelete: boolean, orderCount: number}>}
 */
export const canDeleteService = async (serviceId) => {
  try {
    const ordersRef = collection(db, 'orders');
    const activeStatuses = ['recibidos', 'proceso', 'listos', 'enEntrega'];

    // Optimized: Query only active orders
    const q = query(ordersRef, where('orderStatus', 'in', activeStatuses));
    const querySnapshot = await getDocs(q);

    let orderCount = 0;

    querySnapshot.forEach((doc) => {
      const order = doc.data();
      // Check if any service in the order references this serviceId
      const hasService = order.services?.some(service => service.serviceId === serviceId);
      if (hasService) {
        orderCount++;
      }
    });

    return {
      canDelete: orderCount === 0,
      orderCount
    };
  } catch (error) {
    console.error('Error checking if service can be deleted:', error);
    throw error;
  }
};

/**
 * Delete a service
 * @param {string} serviceId - Service document ID
 */
export const deleteService = async (serviceId) => {
  try {
    // Validate that service can be deleted
    const validation = await canDeleteService(serviceId);
    if (!validation.canDelete) {
      throw new Error(`No se puede eliminar este servicio. Está referenciado en ${validation.orderCount} orden(es) activa(s).`);
    }

    const serviceRef = doc(db, 'services', serviceId);
    await deleteDoc(serviceRef);
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

// ==================== CLIENTS ====================

/**
 * Get all clients
 * @returns {Promise<Array>} Array of clients
 */
export const getAllClients = async () => {
  try {
    const clientsRef = collection(db, 'clients');
    const querySnapshot = await getDocs(clientsRef);

    const clients = [];
    querySnapshot.forEach((doc) => {
      clients.push({ id: doc.id, ...doc.data() });
    });

    return clients;
  } catch (error) {
    console.error('Error getting clients:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time clients updates
 * @param {Function} callback - Function to call when clients change
 * @returns {Function} Unsubscribe function
 */
export const subscribeToClients = (callback) => {
  try {
    const clientsRef = collection(db, 'clients');

    return onSnapshot(clientsRef, (snapshot) => {
      const clients = [];
      snapshot.forEach((doc) => {
        clients.push({ id: doc.id, ...doc.data() });
      });
      callback(clients);
    }, (error) => {
      console.error('Error in clients subscription:', error);
    });
  } catch (error) {
    console.error('Error subscribing to clients:', error);
    throw error;
  }
};

/**
 * Find client by phone number
 * @param {string} phone - Phone number to search
 * @returns {Promise<Object|null>} Client object if found, null otherwise
 */
export const findClientByPhone = async (phone) => {
  try {
    const clientsRef = collection(db, 'clients');
    const q = query(clientsRef, where('phone', '==', phone));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error finding client by phone:', error);
    throw error;
  }
};

/**
 * Find client by name (case-insensitive)
 * @param {string} name - Client name to search
 * @returns {Promise<Object|null>} Client object if found, null otherwise
 */
export const findClientByName = async (name) => {
  try {
    const clientsRef = collection(db, 'clients');
    const querySnapshot = await getDocs(clientsRef);

    // Buscar manualmente porque Firestore no soporta búsqueda case-insensitive directa
    let foundClient = null;
    querySnapshot.forEach((doc) => {
      const clientData = doc.data();
      if (clientData.name && clientData.name.toLowerCase() === name.toLowerCase()) {
        foundClient = { id: doc.id, ...clientData };
      }
    });

    return foundClient;
  } catch (error) {
    console.error('Error finding client by name:', error);
    throw error;
  }
};

/**
 * Add a new client
 * @param {Object} clientData - Client data
 * @returns {Promise<string>} Document ID of the created client
 */
export const addClient = async (clientData) => {
  try {
    const clientsRef = collection(db, 'clients');
    const docRef = await addDoc(clientsRef, {
      ...clientData,
      orders: 0,
      debt: 0,
      isVip: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding client:', error);
    throw error;
  }
};

/**
 * Update an existing client
 * @param {string} clientId - Client document ID
 * @param {Object} clientData - Updated client data
 */
export const updateClient = async (clientId, clientData) => {
  try {
    const clientRef = doc(db, 'clients', clientId);
    await updateDoc(clientRef, {
      ...clientData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

/**
 * Check if a client can be deleted (not referenced in active orders)
 * @param {string} clientId - Client document ID
 * @returns {Promise<{canDelete: boolean, orderCount: number}>}
 */
export const canDeleteClient = async (clientId) => {
  try {
    const ordersRef = collection(db, 'orders');
    const activeStatuses = ['recibidos', 'proceso', 'listos', 'enEntrega'];

    // Optimized: Query only active orders for this specific client
    const q = query(
      ordersRef,
      where('clientId', '==', clientId),
      where('orderStatus', 'in', activeStatuses),
      limit(1) // We only need to know if at least one exists
    );
    const querySnapshot = await getDocs(q);

    const orderCount = querySnapshot.size;

    return {
      canDelete: orderCount === 0,
      orderCount
    };
  } catch (error) {
    console.error('Error checking if client can be deleted:', error);
    throw error;
  }
};

/**
 * Delete a client
 * @param {string} clientId - Client document ID
 */
export const deleteClient = async (clientId) => {
  try {
    // Validate that client can be deleted
    const validation = await canDeleteClient(clientId);
    if (!validation.canDelete) {
      throw new Error(`No se puede eliminar este cliente. Tiene ${validation.orderCount} orden(es) activa(s).`);
    }

    const clientRef = doc(db, 'clients', clientId);
    await deleteDoc(clientRef);
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

// ==================== EMPLOYEES ====================

/**
 * Get all employees
 * @returns {Promise<Array>} Array of employees
 */
export const getAllEmployees = async () => {
  try {
    const employeesRef = collection(db, 'employees');
    const querySnapshot = await getDocs(employeesRef);

    const employees = [];
    querySnapshot.forEach((doc) => {
      employees.push({ id: doc.id, ...doc.data() });
    });

    return employees;
  } catch (error) {
    console.error('Error getting employees:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time employees updates
 * @param {Function} callback - Function to call when employees change
 * @returns {Function} Unsubscribe function
 */
export const subscribeToEmployees = (callback) => {
  try {
    const employeesRef = collection(db, 'employees');

    return onSnapshot(employeesRef, (snapshot) => {
      const employees = [];
      snapshot.forEach((doc) => {
        employees.push({ id: doc.id, ...doc.data() });
      });
      callback(employees);
    }, (error) => {
      console.error('Error in employees subscription:', error);
    });
  } catch (error) {
    console.error('Error subscribing to employees:', error);
    throw error;
  }
};

/**
 * Get count of active admin employees
 * @returns {Promise<number>} Count of active admins
 */
export const getAdminCount = async () => {
  try {
    const employeesRef = collection(db, 'employees');
    const q = query(
      employeesRef,
      where('isAdmin', '==', true),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting admin count:', error);
    throw error;
  }
};

/**
 * Get employee by email
 * @param {string} email - Employee email
 * @returns {Promise<Object|null>} Employee data or null if not found
 */
export const getEmployeeByEmail = async (email) => {
  try {
    const employeesRef = collection(db, 'employees');
    const q = query(employeesRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    // Return first matching employee (should be unique)
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error getting employee by email:', error);
    throw error;
  }
};

/**
 * Add a new employee
 * @param {Object} employeeData - Employee data
 * @returns {Promise<string>} Document ID of the created employee
 */
export const addEmployee = async (employeeData) => {
  try {
    const employeesRef = collection(db, 'employees');

    // Check if this is the first employee
    const querySnapshot = await getDocs(employeesRef);
    const isFirstEmployee = querySnapshot.empty;

    const docRef = await addDoc(employeesRef, {
      ...employeeData,
      // First employee is automatically admin
      isAdmin: isFirstEmployee ? true : (employeeData.isAdmin || false),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ [EMPLOYEE] Empleado creado - isAdmin: ${isFirstEmployee ? true : (employeeData.isAdmin || false)}`);

    return docRef.id;
  } catch (error) {
    console.error('Error adding employee:', error);
    throw error;
  }
};

/**
 * Update an existing employee
 * @param {string} employeeId - Employee document ID
 * @param {Object} employeeData - Updated employee data
 */
export const updateEmployee = async (employeeId, employeeData) => {
  try {
    // Get current employee data
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeSnap = await getDoc(employeeRef);

    if (!employeeSnap.exists()) {
      throw new Error('Empleado no encontrado');
    }

    const currentData = employeeSnap.data();

    // VALIDACIÓN: Si intenta quitar admin y es el único admin activo
    if (
      currentData.isAdmin === true &&
      currentData.status === 'active' &&
      (employeeData.isAdmin === false || employeeData.status === 'inactive')
    ) {
      const adminCount = await getAdminCount();

      if (adminCount <= 1) {
        throw new Error('No se puede desactivar el último administrador. Debe haber al menos un administrador activo en el sistema.');
      }
    }

    await updateDoc(employeeRef, {
      ...employeeData,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ [EMPLOYEE] Empleado actualizado: ${employeeId}`);
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

/**
 * Check if an employee can be deleted (not assigned to active orders)
 * @param {string} employeeId - Employee document ID
 * @returns {Promise<{canDelete: boolean, orderCount: number}>}
 */
export const canDeleteEmployee = async (employeeId) => {
  try {
    const ordersRef = collection(db, 'orders');
    const activeStatuses = ['recibidos', 'proceso', 'listos', 'enEntrega'];

    // Optimized: Query only active orders for this specific employee
    const q = query(
      ordersRef,
      where('authorId', '==', employeeId),
      where('orderStatus', 'in', activeStatuses),
      limit(1) // We only need to know if at least one exists
    );
    const querySnapshot = await getDocs(q);

    const orderCount = querySnapshot.size;

    return {
      canDelete: orderCount === 0,
      orderCount
    };
  } catch (error) {
    console.error('Error checking if employee can be deleted:', error);
    throw error;
  }
};

/**
 * Delete an employee
 * @param {string} employeeId - Employee document ID
 */
export const deleteEmployee = async (employeeId) => {
  try {
    // VALIDACIÓN 1: Check if employee has active orders assigned
    const validation = await canDeleteEmployee(employeeId);
    if (!validation.canDelete) {
      throw new Error(`No se puede eliminar este empleado. Tiene ${validation.orderCount} orden(es) asignada(s).`);
    }

    // Get current employee data
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeSnap = await getDoc(employeeRef);

    if (!employeeSnap.exists()) {
      throw new Error('Empleado no encontrado');
    }

    const currentData = employeeSnap.data();

    // VALIDACIÓN 2: No se puede eliminar al último admin activo
    if (currentData.isAdmin === true && currentData.status === 'active') {
      const adminCount = await getAdminCount();

      if (adminCount <= 1) {
        throw new Error('No se puede eliminar el último administrador. Debe haber al menos un administrador activo en el sistema.');
      }
    }

    await deleteDoc(employeeRef);
    console.log(`✅ [EMPLOYEE] Empleado eliminado: ${employeeId}`);
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

// ==================== INVENTORY ====================

/**
 * Get all inventory products
 * @returns {Promise<Array>} Array of products
 */
export const getAllInventory = async () => {
  try {
    const inventoryRef = collection(db, 'inventory');
    const querySnapshot = await getDocs(inventoryRef);

    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });

    return products;
  } catch (error) {
    console.error('Error getting inventory:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time inventory updates
 * @param {Function} callback - Function to call when inventory changes
 * @returns {Function} Unsubscribe function
 */
export const subscribeToInventory = (callback) => {
  try {
    const inventoryRef = collection(db, 'inventory');

    return onSnapshot(inventoryRef, (snapshot) => {
      const products = [];
      snapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });
      callback(products);
    }, (error) => {
      console.error('Error in inventory subscription:', error);
    });
  } catch (error) {
    console.error('Error subscribing to inventory:', error);
    throw error;
  }
};

/**
 * Add a new product to inventory
 * @param {Object} productData - Product data
 * @returns {Promise<string>} Document ID of the created product
 */
export const addProduct = async (productData) => {
  try {
    const inventoryRef = collection(db, 'inventory');
    const docRef = await addDoc(inventoryRef, {
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

/**
 * Update an existing product in inventory
 * @param {string} productId - Product document ID
 * @param {Object} productData - Updated product data
 */
export const updateProduct = async (productId, productData) => {
  try {
    const productRef = doc(db, 'inventory', productId);
    await updateDoc(productRef, {
      ...productData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

/**
 * Delete a product from inventory
 * @param {string} productId - Product document ID
 */
export const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, 'inventory', productId);
    await deleteDoc(productRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

/**
 * Decrease product stock in inventory
 * @param {string} productId - Product document ID
 * @param {number} quantity - Quantity to decrease
 */
export const decreaseProductStock = async (productId, quantity) => {
  try {
    const productRef = doc(db, 'inventory', productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      throw new Error(`Product ${productId} not found`);
    }

    const currentStock = productDoc.data().stock || 0;
    const newStock = currentStock - quantity;

    if (newStock < 0) {
      throw new Error(`Insufficient stock for product ${productId}. Available: ${currentStock}, Requested: ${quantity}`);
    }

    await updateDoc(productRef, {
      stock: newStock,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error decreasing product stock:', error);
    throw error;
  }
};

// ==================== BACKUP ====================

/**
 * Export all data for backup
 * @returns {Promise<Object>} All data organized by collection
 */
export const exportAllData = async () => {
  try {
    const [orders, services, clients, employees, inventory, settings, expenses, cashClosures] = await Promise.all([
      getAllOrders(),
      getAllServices(),
      getAllClients(),
      getAllEmployees(),
      getAllInventory(),
      getAllSettings(),
      getAllExpenses(),
      getAllCashRegisterClosures()
    ]);

    return {
      orders,
      services,
      clients,
      employees,
      inventory,
      settings,
      expenses,
      cashClosures,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

// ==================== BUSINESS PROFILE ====================

/**
 * Save business profile to Firestore
 * @param {Object} profileData - Business profile data
 * @returns {Promise<Object>} Saved profile data
 */
export const saveBusinessProfile = async (profileData) => {
  try {
    // Prepare profile data
    const profile = {
      businessName: profileData.businessName || '',
      phone: profileData.phone || '',
      address: profileData.address || '',
      updatedAt: new Date().toISOString()
    };

    // Save to Firestore (document with fixed ID)
    const profileRef = doc(db, 'settings', 'business-profile');
    await setDoc(profileRef, profile, { merge: true });

    return profile;
  } catch (error) {
    console.error('Error saving business profile:', error);
    throw error;
  }
};

/**
 * Get business profile from Firestore
 * @returns {Promise<Object>} Business profile data
 */
export const getBusinessProfile = async () => {
  try {
    const profileRef = doc(db, 'settings', 'business-profile');
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      return profileSnap.data();
    } else {
      // Return default profile if doesn't exist
      return {
        businessName: 'Clean Master Shoes',
        phone: '',
        address: ''
      };
    }
  } catch (error) {
    console.error('Error getting business profile:', error);
    throw error;
  }
};

/**
 * Save WhatsApp configuration to Firestore
 * @param {Object} configData - WhatsApp configuration data
 * @returns {Promise<Object>} Saved configuration
 */
export const saveWhatsAppConfig = async (configData) => {
  try {
    // Prepare config data
    const config = {
      enableOrderReceived: configData.enableOrderReceived ?? true,
      enableDeliveryReady: configData.enableDeliveryReady ?? true,
      updatedAt: new Date().toISOString()
    };

    // Save to Firestore (document with fixed ID)
    const configRef = doc(db, 'settings', 'whatsapp-config');
    await setDoc(configRef, config, { merge: true });

    return config;
  } catch (error) {
    console.error('Error saving WhatsApp config:', error);
    throw error;
  }
};

/**
 * Get WhatsApp configuration from Firestore
 * @returns {Promise<Object>} WhatsApp configuration data
 */
export const getWhatsAppConfig = async () => {
  try {
    const configRef = doc(db, 'settings', 'whatsapp-config');
    const configSnap = await getDoc(configRef);

    if (configSnap.exists()) {
      return configSnap.data();
    } else {
      // Return default config if doesn't exist
      return {
        enableOrderReceived: true,
        enableDeliveryReady: true
      };
    }
  } catch (error) {
    console.error('Error getting WhatsApp config:', error);
    throw error;
  }
};

/**
 * Get all settings documents from Firestore
 * @returns {Promise<Array>} All settings documents
 */
export const getAllSettings = async () => {
  try {
    const settingsRef = collection(db, 'settings');
    const querySnapshot = await getDocs(settingsRef);

    const settings = [];
    querySnapshot.forEach((doc) => {
      settings.push({ id: doc.id, ...doc.data() });
    });

    return settings;
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
};

// ==================== EXPENSES ====================

// ==================== CASH REGISTER ====================

/**
 * Save or update cash register draft for today
 * @param {Object} draftData - Draft data
 * @returns {Promise<void>}
 */
export const saveCashRegisterDraft = async (draftData) => {
  try {
    const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const draftRef = doc(db, 'cashRegisterDrafts', today);

    await setDoc(draftRef, {
      ...draftData,
      fecha: today,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving cash register draft:', error);
    throw error;
  }
};

/**
 * Subscribe to today's cash register draft
 * @param {Function} callback - Callback function that receives draft data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCashRegisterDraft = (callback) => {
  try {
    const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const draftRef = doc(db, 'cashRegisterDrafts', today);

    return onSnapshot(draftRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in draft subscription:', error);
      callback(null);
    });
  } catch (error) {
    console.error('Error subscribing to cash register draft:', error);
    return () => {};
  }
};

/**
 * Delete today's cash register draft
 * @returns {Promise<void>}
 */
export const deleteCashRegisterDraft = async () => {
  try {
    const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const draftRef = doc(db, 'cashRegisterDrafts', today);
    await deleteDoc(draftRef);
  } catch (error) {
    console.error('Error deleting cash register draft:', error);
    throw error;
  }
};

/**
 * Save a cash register closure (corte de caja)
 * @param {Object} closureData - Closure data
 * @returns {Promise<string>} Document ID of the created closure
 */
export const saveCashRegisterClosure = async (closureData) => {
  try {
    const closuresRef = collection(db, 'cash-register-closures');
    const docRef = await addDoc(closuresRef, {
      ...closureData,
      createdAt: new Date().toISOString(),
      // Cortes son inmutables (solo lectura)
      readonly: true
    });

    return docRef.id;
  } catch (error) {
    console.error('Error saving cash register closure:', error);
    throw error;
  }
};

/**
 * Get all cash register closures
 * @returns {Promise<Array>} Array of closures
 */
export const getAllCashRegisterClosures = async () => {
  try {
    const closuresRef = collection(db, 'cash-register-closures');
    const q = query(closuresRef, orderBy('fechaCorte', 'desc'));
    const querySnapshot = await getDocs(q);

    const closures = [];
    querySnapshot.forEach((doc) => {
      closures.push({ id: doc.id, ...doc.data() });
    });

    return closures;
  } catch (error) {
    console.error('Error getting cash register closures:', error);
    throw error;
  }
};

/**
 * Get the last cash register closure
 * @returns {Promise<Object|null>} Last closure or null if none exists
 */
export const getLastCashRegisterClosure = async () => {
  try {
    const closuresRef = collection(db, 'cash-register-closures');
    const q = query(closuresRef, orderBy('fechaCorte', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error getting last cash register closure:', error);
    throw error;
  }
};

/**
 * Subscribe to cash register closures real-time updates
 * @param {Function} callback - Callback function that receives closures array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCashRegisterClosures = (callback) => {
  try {
    const closuresRef = collection(db, 'cash-register-closures');
    const q = query(closuresRef, orderBy('fechaCorte', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const closures = [];
      snapshot.forEach((doc) => {
        closures.push({ id: doc.id, ...doc.data() });
      });
      callback(closures);
    }, (error) => {
      console.error('Error in cash register closures subscription:', error);
    });
  } catch (error) {
    console.error('Error subscribing to cash register closures:', error);
    throw error;
  }
};

// ==================== PRINT TRACKING ====================

/**
 * Agregar registro de impresión al historial de la orden
 * @param {string} orderId - ID de la orden
 * @param {Object} printData - Datos de la impresión
 * @returns {Promise<Object>} Resultado de la operación
 */
export const addPrintRecord = async (orderId, printData) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      printHistory: arrayUnion(printData)
    });
    return { success: true };
  } catch (error) {
    console.error('Error adding print record:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verificar si ya existe un registro de impresión de cierto tipo
 * @param {Object} order - Objeto de orden
 * @param {string} type - Tipo de ticket ('receipt' o 'delivery')
 * @returns {boolean}
 */
export const hasPrintRecord = (order, type) => {
  if (!order.printHistory || order.printHistory.length === 0) {
    return false;
  }
  return order.printHistory.some(record => record.type === type);
};

/**
 * Obtener todos los registros de un tipo específico
 * @param {Object} order - Objeto de orden
 * @param {string} type - Tipo de ticket ('receipt' o 'delivery')
 * @returns {Array}
 */
export const getPrintRecords = (order, type) => {
  if (!order.printHistory) return [];
  return order.printHistory.filter(record => record.type === type);
};

// ==================== PROMOTIONS ====================

/**
 * Get all promotions
 * @returns {Promise<Array>} Array of promotions
 */
export const getAllPromotions = async () => {
  try {
    const promotionsRef = collection(db, 'promotions');
    const querySnapshot = await getDocs(promotionsRef);

    const promotions = [];
    querySnapshot.forEach((doc) => {
      promotions.push({ id: doc.id, ...doc.data() });
    });

    return promotions;
  } catch (error) {
    console.error('Error getting promotions:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time promotions updates
 * @param {Function} callback - Function to call when promotions change
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPromotions = (callback) => {
  try {
    const promotionsRef = collection(db, 'promotions');

    return onSnapshot(promotionsRef, (snapshot) => {
      const promotions = [];
      snapshot.forEach((doc) => {
        promotions.push({ id: doc.id, ...doc.data() });
      });
      callback(promotions);
    }, (error) => {
      console.error('Error in promotions subscription:', error);
    });
  } catch (error) {
    console.error('Error subscribing to promotions:', error);
    throw error;
  }
};

/**
 * Add a new promotion
 * @param {Object} promotionData - Promotion data
 * @returns {Promise<string>} Document ID of the created promotion
 */
export const addPromotion = async (promotionData) => {
  try {
    const promotionsRef = collection(db, 'promotions');
    const docRef = await addDoc(promotionsRef, {
      ...promotionData,
      currentUses: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding promotion:', error);
    throw error;
  }
};

/**
 * Update an existing promotion
 * @param {string} promotionId - Promotion document ID
 * @param {Object} promotionData - Updated promotion data
 */
export const updatePromotion = async (promotionId, promotionData) => {
  try {
    const promotionRef = doc(db, 'promotions', promotionId);
    await updateDoc(promotionRef, {
      ...promotionData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating promotion:', error);
    throw error;
  }
};

/**
 * Delete a promotion
 * @param {string} promotionId - Promotion document ID
 */
export const deletePromotion = async (promotionId) => {
  try {
    const promotionRef = doc(db, 'promotions', promotionId);
    await deleteDoc(promotionRef);
  } catch (error) {
    console.error('Error deleting promotion:', error);
    throw error;
  }
};

/**
 * Get only active promotions (filtered by date and active status)
 * @returns {Promise<Array>} Array of active promotions
 */
export const getActivePromotions = async () => {
  try {
    const promotionsRef = collection(db, 'promotions');
    const querySnapshot = await getDocs(promotionsRef);

    // Comparar solo fechas (sin hora) para evitar problemas de timezone
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    const activePromotions = [];

    querySnapshot.forEach((doc) => {
      const promo = { id: doc.id, ...doc.data() };

      // Check if promotion is marked as active
      if (!promo.isActive) return;

      // Check if within date range (if dateRange is set)
      if (promo.dateRange) {
        const { startDate, endDate } = promo.dateRange;
        // Extraer solo la parte de fecha para comparación
        const promotionStartDate = startDate ? startDate.split('T')[0] : null;
        const promotionEndDate = endDate ? endDate.split('T')[0] : null;

        if (promotionStartDate && today < promotionStartDate) return;
        if (promotionEndDate && today > promotionEndDate) return;
      }

      // Check if max uses reached (if maxUses is set)
      if (promo.maxUses && promo.currentUses >= promo.maxUses) return;

      activePromotions.push(promo);
    });

    return activePromotions;
  } catch (error) {
    console.error('Error getting active promotions:', error);
    throw error;
  }
};

/**
 * Validate if a promotion can be applied to an order
 * @param {Object} promotion - Promotion object
 * @param {Object} cart - Cart items array
 * @param {string} clientPhone - Client phone number
 * @param {number} subtotal - Order subtotal before discounts
 * @returns {Promise<Object>} Validation result { isValid, reason, discountAmount }
 */
export const validatePromotion = async (promotion, cart, clientPhone, subtotal) => {
  try {
    // Comparar solo fechas (sin hora) para evitar problemas de timezone
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    // 1. Check if promotion is active
    if (!promotion.isActive) {
      return { isValid: false, reason: 'Promoción inactiva' };
    }

    // 2. Check date range
    if (promotion.dateRange) {
      const { startDate, endDate } = promotion.dateRange;
      // Extraer solo la parte de fecha para comparación
      const promotionStartDate = startDate ? startDate.split('T')[0] : null;
      const promotionEndDate = endDate ? endDate.split('T')[0] : null;

      if (promotionStartDate && today < promotionStartDate) {
        return { isValid: false, reason: 'Promoción aún no válida' };
      }
      if (promotionEndDate && today > promotionEndDate) {
        return { isValid: false, reason: 'Promoción expirada' };
      }
    }

    // 3. Check max uses
    if (promotion.maxUses && promotion.currentUses >= promotion.maxUses) {
      return { isValid: false, reason: 'Límite de usos alcanzado' };
    }

    // 4. Check minimum purchase amount
    if (promotion.minPurchaseAmount && subtotal < promotion.minPurchaseAmount) {
      return {
        isValid: false,
        reason: `Compra mínima de $${promotion.minPurchaseAmount} requerida`
      };
    }

    // 5. Check one per client restriction
    if (promotion.onePerClient && clientPhone) {
      const hasUsed = await checkPromotionUsageByClient(promotion.id, clientPhone);
      if (hasUsed) {
        return { isValid: false, reason: 'Ya usaste esta promoción' };
      }
    }

    // 6. Check new clients only restriction
    if (promotion.newClientsOnly && clientPhone) {
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, where('phone', '==', clientPhone));
      const clientSnapshot = await getDocs(q);

      // Si el cliente ya existe, no aplicar la promoción
      if (!clientSnapshot.empty) {
        return { isValid: false, reason: 'Promoción solo para clientes nuevos' };
      }
    }

    // 7. Check day of week restriction (applies to all promotion types)
    if (promotion.daysOfWeek && promotion.daysOfWeek.length > 0) {
      const currentDay = new Date().getDay();
      if (!promotion.daysOfWeek.includes(currentDay)) {
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const validDays = promotion.daysOfWeek.map(d => dayNames[d]).join(', ');
        return {
          isValid: false,
          reason: `Válido solo ${validDays}`
        };
      }
    }

    // Calculate discount amount based on type
    let discountAmount = 0;

    switch (promotion.type) {
      case 'percentage':
        if (promotion.appliesTo === 'all') {
          discountAmount = subtotal * (promotion.discountValue / 100);
        } else if (promotion.appliesTo === 'services') {
          // Calculate only for services
          const servicesTotal = cart
            .filter(item => item.type === 'service')
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
          discountAmount = servicesTotal * (promotion.discountValue / 100);
        } else if (promotion.appliesTo === 'products') {
          // Calculate only for products
          const productsTotal = cart
            .filter(item => item.type === 'product')
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
          discountAmount = productsTotal * (promotion.discountValue / 100);
        } else if (promotion.appliesTo === 'specific' && promotion.specificItems) {
          // Calculate only for specific items
          const applicableTotal = cart
            .filter(item => {
              // Comparar con serviceId o productId, no con el ID temporal del carrito
              if (item.type === 'service' && item.serviceId) {
                return promotion.specificItems.includes(item.serviceId);
              }
              if (item.type === 'product' && item.productId) {
                return promotion.specificItems.includes(item.productId);
              }
              return false;
            })
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
          discountAmount = applicableTotal * (promotion.discountValue / 100);
        }
        break;

      case 'fixed':
        // Si hay items aplicables específicos, calcular solo para esos items
        if (promotion.applicableItems && promotion.applicableItems.length > 0) {
          const applicableItems = cart.filter(item => {
            if (item.type === 'service' && item.serviceId) {
              return promotion.applicableItems.includes(item.serviceId);
            }
            if (item.type === 'product' && item.productId) {
              return promotion.applicableItems.includes(item.productId);
            }
            return false;
          });

          // Calcular cantidad total de items aplicables y multiplicar por descuento fijo
          if (applicableItems.length > 0) {
            const totalQuantity = applicableItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
            discountAmount = promotion.discountValue * totalQuantity;
          }
        } else {
          // Si no hay items específicos, aplicar a cada item del carrito
          const totalQuantity = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
          discountAmount = promotion.discountValue * totalQuantity;
        }
        break;

      case 'dayOfWeek':
        discountAmount = subtotal * (promotion.discountValue / 100);
        break;

      case 'buyXgetY':
        // For buyXgetY, discount is calculated differently (free items)
        const applicableItems = cart.filter(item => {
          // Si no hay items específicos configurados, aplicar a todos los items del carrito
          if (!promotion.applicableItems || promotion.applicableItems.length === 0) {
            return true;
          }

          // Para servicios, comparar con serviceId
          if (item.type === 'service' && item.serviceId) {
            return promotion.applicableItems.includes(item.serviceId);
          }

          // Para productos, comparar con productId
          if (item.type === 'product' && item.productId) {
            return promotion.applicableItems.includes(item.productId);
          }

          return false;
        });

        console.log('🔍 [Promo Debug - 2x1]', {
          promotionName: promotion.name,
          totalItemsInCart: cart.length,
          applicableItemsFound: applicableItems.length,
          applicableItemsDetails: applicableItems.map(i => ({
            type: i.type,
            name: i.type === 'service' ? i.serviceName : i.name,
            quantity: i.quantity,
            cartItemId: i.id,
            serviceId: i.serviceId,
            productId: i.productId
          })),
          configuredApplicableItems: promotion.applicableItems,
          buyQuantity: promotion.buyQuantity,
          getQuantity: promotion.getQuantity
        });

        if (applicableItems.length > 0) {
          const totalQty = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
          const sets = Math.floor(totalQty / promotion.buyQuantity);
          const freeItems = sets * promotion.getQuantity;
          // Usar el precio más barato para regalar (beneficia al negocio)
          const itemPrice = Math.min(...applicableItems.map(i => i.price));
          discountAmount = freeItems * itemPrice;

          console.log('✅ [Promo Calculation]', {
            totalQuantity: totalQty,
            setsEarned: sets,
            freeItemsGranted: freeItems,
            itemPrice: itemPrice,
            totalDiscount: discountAmount
          });
        } else {
          console.log('❌ [Promo Not Applied]', 'No items in cart match applicableItems');
        }
        break;

      case 'buyXgetYdiscount':
        // For buyXgetYdiscount, apply percentage discount to cheapest item per set
        const applicableItemsDisc = cart.filter(item => {
          // Si no hay items específicos configurados, aplicar a todos los items del carrito
          if (!promotion.applicableItems || promotion.applicableItems.length === 0) {
            return true;
          }

          // Para servicios, comparar con serviceId
          if (item.type === 'service' && item.serviceId) {
            return promotion.applicableItems.includes(item.serviceId);
          }

          // Para productos, comparar con productId
          if (item.type === 'product' && item.productId) {
            return promotion.applicableItems.includes(item.productId);
          }

          return false;
        });

        if (applicableItemsDisc.length > 0) {
          const totalQty = applicableItemsDisc.reduce((sum, item) => sum + item.quantity, 0);
          const sets = Math.floor(totalQty / promotion.buyQuantity);

          if (sets > 0) {
            // Encontrar el precio más barato para aplicar el descuento
            const cheapestPrice = Math.min(...applicableItemsDisc.map(i => i.price));
            // Aplicar porcentaje de descuento al precio más barato
            const discountPerItem = cheapestPrice * (promotion.discountPercentage / 100);
            discountAmount = sets * discountPerItem;

            console.log('✅ [Promo BuyXgetYdiscount]', {
              totalQuantity: totalQty,
              setsEarned: sets,
              cheapestPrice: cheapestPrice,
              discountPercentage: promotion.discountPercentage,
              discountPerSet: discountPerItem,
              totalDiscount: discountAmount
            });
          }
        }
        break;

      case 'combo':
        // For combo, check if all items are in cart with sufficient quantities
        if (promotion.comboItems) {
          const hasAllItemsWithQuantity = promotion.comboItems.every(comboItem => {
            const requiredQty = comboItem.quantity || 1;

            // Buscar el item en el carrito
            const cartItem = cart.find(cartItem => {
              if (cartItem.type === 'service' && cartItem.serviceId) {
                return cartItem.serviceId === comboItem.id;
              }
              if (cartItem.type === 'product' && cartItem.productId) {
                return cartItem.productId === comboItem.id;
              }
              return false;
            });

            // Verificar que existe Y tiene suficiente cantidad
            return cartItem && (cartItem.quantity || 1) >= requiredQty;
          });

          if (hasAllItemsWithQuantity) {
            // Calcular precio normal multiplicando por cantidades
            const normalPrice = promotion.comboItems.reduce((sum, item) =>
              sum + (item.price * (item.quantity || 1)), 0
            );
            discountAmount = normalPrice - promotion.comboPrice;
          }
        }
        break;

      default:
        discountAmount = 0;
    }

    return {
      isValid: true,
      reason: 'Válida',
      discountAmount: Math.max(0, discountAmount)
    };

  } catch (error) {
    console.error('Error validating promotion:', error);
    return { isValid: false, reason: 'Error al validar promoción' };
  }
};

/**
 * Increment promotion usage counter
 * @param {string} promotionId - Promotion document ID
 * @param {string} clientPhone - Client phone number (for tracking)
 * @returns {Promise<void>}
 */
export const incrementPromotionUsage = async (promotionId, clientPhone) => {
  try {
    const promotionRef = doc(db, 'promotions', promotionId);
    const promotionSnap = await getDoc(promotionRef);

    if (!promotionSnap.exists()) {
      throw new Error('Promotion not found');
    }

    const currentUses = promotionSnap.data().currentUses || 0;

    // Update usage counter
    await updateDoc(promotionRef, {
      currentUses: currentUses + 1,
      updatedAt: new Date().toISOString()
    });

    // If onePerClient is enabled, track this usage
    if (promotionSnap.data().onePerClient && clientPhone) {
      const usageRef = collection(db, 'promotions', promotionId, 'clientUsage');
      await addDoc(usageRef, {
        clientPhone,
        usedAt: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error incrementing promotion usage:', error);
    throw error;
  }
};

/**
 * Check if a client has already used a promotion
 * @param {string} promotionId - Promotion document ID
 * @param {string} clientPhone - Client phone number
 * @returns {Promise<boolean>} True if client has used this promotion
 */
export const checkPromotionUsageByClient = async (promotionId, clientPhone) => {
  try {
    const usageRef = collection(db, 'promotions', promotionId, 'clientUsage');
    const q = query(usageRef, where('clientPhone', '==', clientPhone));
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking promotion usage by client:', error);
    return false;
  }
};
