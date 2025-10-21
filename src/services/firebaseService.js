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
  where,
  runTransaction
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
    // Si hay productos en la orden, usar transacción para garantizar atomicidad
    if (orderData.products && orderData.products.length > 0) {
      return await runTransaction(db, async (transaction) => {
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
        transaction.set(orderRef, {
          ...orderData,
          orderStatus: 'recibidos',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

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
    } else {
      // Si no hay productos, crear orden normalmente
      const ordersRef = collection(db, 'orders');
      const docRef = await addDoc(ordersRef, {
        ...orderData,
        orderStatus: 'recibidos',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return docRef.id;
    }
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
 * Add a new employee
 * @param {Object} employeeData - Employee data
 * @returns {Promise<string>} Document ID of the created employee
 */
export const addEmployee = async (employeeData) => {
  try {
    const employeesRef = collection(db, 'employees');
    const docRef = await addDoc(employeesRef, {
      ...employeeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

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
    const employeeRef = doc(db, 'employees', employeeId);
    await updateDoc(employeeRef, {
      ...employeeData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

/**
 * Delete an employee
 * @param {string} employeeId - Employee document ID
 */
export const deleteEmployee = async (employeeId) => {
  try {
    const employeeRef = doc(db, 'employees', employeeId);
    await deleteDoc(employeeRef);
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
    const [orders, services, clients, employees, inventory] = await Promise.all([
      getAllOrders(),
      getAllServices(),
      getAllClients(),
      getAllEmployees(),
      getAllInventory()
    ]);

    return {
      orders,
      services,
      clients,
      employees,
      inventory,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};
