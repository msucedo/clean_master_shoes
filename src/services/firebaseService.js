import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  onSnapshot,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

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
      completados: []
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
        completados: []
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
    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      orderStatus: 'recibidos',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding order:', error);
    throw error;
  }
};

/**
 * Update an existing order
 * @param {string} orderId - Order document ID
 * @param {Object} orderData - Updated order data
 */
export const updateOrder = async (orderId, orderData) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      ...orderData,
      updatedAt: new Date().toISOString()
    });
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
 * Update order status (move to different column)
 * @param {string} orderId - Order document ID
 * @param {string} newStatus - New status (recibidos, proceso, listos, enEntrega, completados)
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      orderStatus: newStatus,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating order status:', error);
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
 * Delete a service
 * @param {string} serviceId - Service document ID
 */
export const deleteService = async (serviceId) => {
  try {
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
 * Delete a client
 * @param {string} clientId - Client document ID
 */
export const deleteClient = async (clientId) => {
  try {
    const clientRef = doc(db, 'clients', clientId);
    await deleteDoc(clientRef);
  } catch (error) {
    console.error('Error deleting client:', error);
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
    const [orders, services, clients] = await Promise.all([
      getAllOrders(),
      getAllServices(),
      getAllClients()
    ]);

    return {
      orders,
      services,
      clients,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};
