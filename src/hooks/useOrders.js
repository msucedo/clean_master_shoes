import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, onSnapshot, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * React Query hook for real-time orders subscription
 *
 * This hook creates a SINGLE shared subscription to the orders collection
 * that is reused across all components. This prevents duplicate Firestore reads.
 *
 * @param {Object} options - Query options
 * @param {number} options.limitCount - Maximum number of orders to fetch (default: 200)
 * @param {boolean} options.enabled - Whether the query is enabled (default: true)
 * @returns {Object} React Query result with orders data grouped by status
 */
export function useOrders(options = {}) {
  const { limitCount = 200, enabled = true } = options;
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['orders', { limitCount }],
    enabled,
    queryFn: () => {
      return new Promise((resolve, reject) => {
        // Build the Firestore query with limit
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          orderBy('createdAt', 'desc'),
          firestoreLimit(limitCount)
        );

        // Create the real-time listener
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            // Group orders by status
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

            // First time: resolve the promise (loading → success)
            resolve(orders);

            // Subsequent updates: update cache directly (real-time updates)
            queryClient.setQueryData(['orders', { limitCount }], orders);
          },
          (error) => {
            console.error('Error in orders subscription:', error);
            reject(error);
          }
        );

        // Cleanup: unsubscribe when query is garbage collected
        return () => {
          unsubscribe();
        };
      });
    },
  });
}
