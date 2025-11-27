import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * React Query hook for real-time promotions subscription
 *
 * Creates a SINGLE shared subscription to the promotions collection
 *
 * @param {Object} options - Query options
 * @param {boolean} options.enabled - Whether the query is enabled (default: true)
 * @returns {Object} React Query result with promotions array
 */
export function usePromotions(options = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['promotions'],
    enabled,
    queryFn: () => {
      return new Promise((resolve, reject) => {
        const promotionsRef = collection(db, 'promotions');

        const unsubscribe = onSnapshot(
          promotionsRef,
          (snapshot) => {
            const promotions = [];
            snapshot.forEach((doc) => {
              promotions.push({ id: doc.id, ...doc.data() });
            });

            // First time: resolve the promise
            resolve(promotions);

            // Subsequent updates: update cache directly
            queryClient.setQueryData(['promotions'], promotions);
          },
          (error) => {
            console.error('Error in promotions subscription:', error);
            reject(error);
          }
        );

        // Cleanup
        return () => unsubscribe();
      });
    },
  });
}
