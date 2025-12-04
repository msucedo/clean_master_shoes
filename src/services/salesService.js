import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  runTransaction,
  arrayUnion
} from 'firebase/firestore';

/**
 * Crea una nueva venta en la colección 'sales'
 * @param {Object} saleData - Datos de la venta
 * @param {Array} saleData.items - Array de productos vendidos
 * @param {number} saleData.subtotal - Subtotal de la venta
 * @param {number} saleData.discount - Descuento aplicado
 * @param {string} saleData.discountType - Tipo de descuento ('amount' o 'percentage')
 * @param {number} saleData.total - Total de la venta
 * @param {string} saleData.paymentMethod - Método de pago
 * @param {string} saleData.paymentStatus - Estado del pago ('paid', 'partial', 'pending')
 * @param {number} saleData.amountReceived - Monto recibido
 * @param {number} saleData.change - Cambio devuelto
 * @param {string} saleData.clientId - ID del cliente (opcional)
 * @param {string} saleData.notes - Notas adicionales
 * @returns {Promise<string>} ID de la venta creada
 */
export const createSale = async (saleData) => {
  try {
    // Usar una transacción para garantizar la atomicidad
    const saleId = await runTransaction(db, async (transaction) => {

      // ========== FASE 1: TODAS LAS LECTURAS ==========
      const productRefs = [];
      const productDocs = [];

      // Leer y validar todos los productos
      for (const item of saleData.items) {
        const productRef = doc(db, 'inventory', item.id);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          throw new Error(`Producto ${item.name} no encontrado`);
        }

        const currentStock = productDoc.data().stock;
        if (currentStock < item.quantity) {
          throw new Error(
            `Stock insuficiente para ${item.name}. Disponible: ${currentStock}, Requerido: ${item.quantity}`
          );
        }

        // Almacenar refs y docs para fase 2
        productRefs.push(productRef);
        productDocs.push(productDoc);
      }

      // ========== FASE 2: TODAS LAS ESCRITURAS ==========

      // 1. Crear la venta
      const salesRef = collection(db, 'sales');
      const newSaleRef = doc(salesRef);

      const saleRecord = {
        items: saleData.items.map(item => ({
          productId: item.id,
          name: item.name,
          barcode: item.barcode || '',
          emoji: item.emoji || '📦',
          quantity: item.quantity,
          salePrice: item.salePrice,
          purchasePrice: item.purchasePrice || 0,
          subtotal: item.salePrice * item.quantity
        })),
        subtotal: saleData.subtotal,
        discount: saleData.discount || 0,
        discountType: saleData.discountType || 'amount',
        discountAmount: saleData.discountAmount || 0,
        total: saleData.total,
        paymentMethod: saleData.paymentMethod || 'cash',
        paymentStatus: saleData.paymentStatus || 'paid',
        amountReceived: saleData.amountReceived || saleData.total,
        change: saleData.change || 0,
        clientId: saleData.clientId || null,
        clientName: saleData.clientName || null,
        notes: saleData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: saleData.createdBy || 'system'
      };

      transaction.set(newSaleRef, saleRecord);

      // 2. Actualizar stock usando datos almacenados (NO leer de nuevo)
      saleData.items.forEach((item, index) => {
        const currentStock = productDocs[index].data().stock;
        const newStock = currentStock - item.quantity;

        transaction.update(productRefs[index], {
          stock: newStock,
          updatedAt: new Date().toISOString()
        });
      });

      return newSaleRef.id;
    });

    console.log('Venta creada exitosamente:', saleId);
    return saleId;
  } catch (error) {
    console.error('Error al crear venta:', error);
    throw error;
  }
};

/**
 * Actualiza el stock de un producto en el inventario
 * @param {string} productId - ID del producto
 * @param {number} quantitySold - Cantidad vendida
 * @returns {Promise<void>}
 */
export const updateInventoryStock = async (productId, quantitySold) => {
  try {
    const productRef = doc(db, 'inventory', productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      throw new Error(`Producto con ID ${productId} no encontrado`);
    }

    const currentStock = productDoc.data().stock;
    const newStock = currentStock - quantitySold;

    if (newStock < 0) {
      throw new Error('Stock insuficiente');
    }

    await updateDoc(productRef, {
      stock: newStock,
      updatedAt: new Date().toISOString()
    });

    console.log(`Stock actualizado para producto ${productId}: ${currentStock} -> ${newStock}`);
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    throw error;
  }
};

/**
 * Suscripción en tiempo real a las ventas
 * @param {Function} callback - Función que se ejecuta cuando hay cambios
 * @returns {Function} Función para cancelar la suscripción
 */
export const subscribeToSales = (callback) => {
  try {
    const salesRef = collection(db, 'sales');
    const q = query(salesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sales = [];
      snapshot.forEach((doc) => {
        sales.push({ id: doc.id, ...doc.data() });
      });
      callback(sales);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error al suscribirse a ventas:', error);
    throw error;
  }
};

/**
 * Obtiene una venta por su ID
 * @param {string} saleId - ID de la venta
 * @returns {Promise<Object>} Datos de la venta
 */
export const getSaleById = async (saleId) => {
  try {
    const saleRef = doc(db, 'sales', saleId);
    const saleDoc = await getDoc(saleRef);

    if (!saleDoc.exists()) {
      throw new Error(`Venta con ID ${saleId} no encontrada`);
    }

    return { id: saleDoc.id, ...saleDoc.data() };
  } catch (error) {
    console.error('Error al obtener venta:', error);
    throw error;
  }
};

/**
 * Cancela una venta y restaura el stock
 * @param {string} saleId - ID de la venta a cancelar
 * @returns {Promise<void>}
 */
export const cancelSale = async (saleId) => {
  try {
    await runTransaction(db, async (transaction) => {
      const saleRef = doc(db, 'sales', saleId);
      const saleDoc = await transaction.get(saleRef);

      if (!saleDoc.exists()) {
        throw new Error('Venta no encontrada');
      }

      const saleData = saleDoc.data();

      // Restaurar el stock de cada producto
      for (const item of saleData.items) {
        const productRef = doc(db, 'inventory', item.productId);
        const productDoc = await transaction.get(productRef);

        if (productDoc.exists()) {
          const currentStock = productDoc.data().stock;
          const restoredStock = currentStock + item.quantity;

          transaction.update(productRef, {
            stock: restoredStock,
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Marcar la venta como cancelada
      transaction.update(saleRef, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    console.log('Venta cancelada y stock restaurado');
  } catch (error) {
    console.error('Error al cancelar venta:', error);
    throw error;
  }
};

/**
 * Agrega un registro de impresión al historial de una venta
 * @param {string} saleId - ID de la venta
 * @param {Object} printData - Datos de la impresión
 * @returns {Promise<Object>}
 */
export const addSalePrintRecord = async (saleId, printData) => {
  try {
    const saleRef = doc(db, 'sales', saleId);
    await updateDoc(saleRef, {
      printHistory: arrayUnion(printData)
    });
    return { success: true };
  } catch (error) {
    console.error('Error adding sale print record:', error);
    return { success: false, error: error.message };
  }
};
