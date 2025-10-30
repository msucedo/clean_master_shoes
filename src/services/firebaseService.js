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
  runTransaction,
  setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { sendDeliveryNotification } from './whatsappService';

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

    let whatsappResult = null;
    let updateData = {
      ...orderData,
      updatedAt: new Date().toISOString()
    };

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

    // Update the order
    await updateDoc(orderRef, updateData);

    // Return result with WhatsApp info if applicable
    return {
      success: true,
      whatsappResult: whatsappResult
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
 * Delete an employee
 * @param {string} employeeId - Employee document ID
 */
export const deleteEmployee = async (employeeId) => {
  try {
    // Get current employee data
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeSnap = await getDoc(employeeRef);

    if (!employeeSnap.exists()) {
      throw new Error('Empleado no encontrado');
    }

    const currentData = employeeSnap.data();

    // VALIDACIÓN: No se puede eliminar al último admin activo
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
 * Upload logo to Firebase Storage
 * @param {File} file - Logo image file
 * @returns {Promise<string>} URL of uploaded logo
 */
export const uploadLogo = async (file) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido. Usa PNG, JPG o WEBP.');
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 2MB.');
    }

    // Create unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}_logo.${extension}`;

    // Create reference to storage
    const storageRef = ref(storage, `logos/${filename}`);

    // Upload file
    await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
};

/**
 * Save business profile to Firestore
 * @param {Object} profileData - Business profile data
 * @param {File} logoFile - Optional logo file to upload
 * @returns {Promise<Object>} Saved profile data
 */
export const saveBusinessProfile = async (profileData, logoFile = null) => {
  try {
    let logoUrl = profileData.logoUrl || null;

    // Upload logo if provided
    if (logoFile) {
      logoUrl = await uploadLogo(logoFile);
    }

    // Prepare profile data
    const profile = {
      businessName: profileData.businessName || '',
      phone: profileData.phone || '',
      address: profileData.address || '',
      logoUrl: logoUrl,
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
        address: '',
        logoUrl: null
      };
    }
  } catch (error) {
    console.error('Error getting business profile:', error);
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

/**
 * Add a new expense
 * @param {Object} expenseData - Expense data
 * @returns {Promise<string>} Document ID of the created expense
 */
export const addExpense = async (expenseData) => {
  try {
    const expensesRef = collection(db, 'expenses');
    const docRef = await addDoc(expensesRef, {
      ...expenseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

/**
 * Get expenses by date range
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @returns {Promise<Array>} Array of expenses
 */
export const getExpensesByDateRange = async (startDate, endDate) => {
  try {
    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const expenses = [];
    querySnapshot.forEach((doc) => {
      expenses.push({ id: doc.id, ...doc.data() });
    });

    return expenses;
  } catch (error) {
    console.error('Error getting expenses:', error);
    throw error;
  }
};

/**
 * Get all expenses
 * @returns {Promise<Array>} Array of expenses
 */
export const getAllExpenses = async () => {
  try {
    const expensesRef = collection(db, 'expenses');
    const querySnapshot = await getDocs(expensesRef);

    const expenses = [];
    querySnapshot.forEach((doc) => {
      expenses.push({ id: doc.id, ...doc.data() });
    });

    return expenses;
  } catch (error) {
    console.error('Error getting all expenses:', error);
    throw error;
  }
};

/**
 * Delete an expense
 * @param {string} expenseId - Expense document ID
 */
export const deleteExpense = async (expenseId) => {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// ==================== CASH REGISTER ====================

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
