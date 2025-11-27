import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * React Query hook for real-time inventory subscription
 *
 * Creates a SINGLE shared subscription to the inventory collection
 *
 * @param {Object} options - Query options
 * @param {boolean} options.enabled - Whether the query is enabled (default: true)
 * @returns {Object} React Query result with inventory items array
 */
export function useInventory(options = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['inventory'],
    enabled,
    queryFn: () => {
      return new Promise((resolve, reject) => {
        const inventoryRef = collection(db, 'inventory');

        const unsubscribe = onSnapshot(
          inventoryRef,
          (snapshot) => {
            const inventory = [];
            snapshot.forEach((doc) => {
              inventory.push({ id: doc.id, ...doc.data() });
            });

            // First time: resolve the promise
            resolve(inventory);

            // Subsequent updates: update cache directly
            queryClient.setQueryData(['inventory'], inventory);
          },
          (error) => {
            console.error('Error in inventory subscription:', error);
            reject(error);
          }
        );

        // Cleanup
        return () => unsubscribe();
      });
    },
  });
}
