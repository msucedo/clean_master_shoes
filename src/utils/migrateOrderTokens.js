import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { generateTrackingToken } from '../services/firebaseService';

/**
 * Migration script to add tracking tokens to existing orders
 * This is a one-time script to update orders that were created before the tracking feature
 *
 * Usage:
 * 1. Open browser console
 * 2. Run: await window.migrateOrderTokens()
 * 3. Check console for results
 */
export const migrateOrderTokens = async () => {
  try {
    console.log('🔄 [MIGRATION] Iniciando migración de tracking tokens...');

    // Get all orders
    const ordersRef = collection(db, 'orders');
    const querySnapshot = await getDocs(ordersRef);

    console.log(`📊 [MIGRATION] Total de órdenes encontradas: ${querySnapshot.size}`);

    let migratedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Process each order
    for (const orderDoc of querySnapshot.docs) {
      const orderData = orderDoc.data();
      const orderId = orderDoc.id;

      // Skip if order already has a tracking token
      if (orderData.trackingToken) {
        skippedCount++;
        continue;
      }

      try {
        // Generate new tracking token
        const trackingToken = generateTrackingToken();

        // Update order with tracking token
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
          trackingToken: trackingToken,
          updatedAt: new Date().toISOString()
        });

        console.log(`✅ [MIGRATION] Orden ${orderData.orderNumber || orderId} → Token: ${trackingToken}`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ [MIGRATION] Error en orden ${orderId}:`, error);
        errors.push({ orderId, error: error.message });
      }
    }

    // Summary
    console.log('\n📈 [MIGRATION] Resumen de migración:');
    console.log(`   ✅ Órdenes migradas: ${migratedCount}`);
    console.log(`   ⏭️  Órdenes omitidas (ya tenían token): ${skippedCount}`);
    console.log(`   ❌ Errores: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ [MIGRATION] Errores encontrados:');
      errors.forEach(({ orderId, error }) => {
        console.log(`   - Orden ${orderId}: ${error}`);
      });
    }

    console.log('\n✅ [MIGRATION] Migración completada!');

    return {
      success: true,
      migratedCount,
      skippedCount,
      errors,
      total: querySnapshot.size
    };

  } catch (error) {
    console.error('❌ [MIGRATION] Error fatal en migración:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Expose to window for console access
if (typeof window !== 'undefined') {
  window.migrateOrderTokens = migrateOrderTokens;
  console.log('🔧 [MIGRATION] Script de migración cargado. Ejecuta: await window.migrateOrderTokens()');
}
