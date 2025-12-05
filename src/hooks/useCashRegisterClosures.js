import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * React Query hook for real-time cash register closures subscription
 *
 * This hook creates a SINGLE shared subscription to the cashRegisterClosures collection
 * that is reused across all components. This prevents duplicate Firestore reads.
 *
 * @param {Object} options - Query options
 * @param {boolean} options.enabled - Whether the query is enabled (default: true)
 * @returns {Object} React Query result with closures data
 */
export function useCashRegisterClosures(options = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['cashRegisterClosures'],
    enabled,
    queryFn: () => {
      return new Promise((resolve, reject) => {
        // Build the Firestore query
        const closuresRef = collection(db, 'cash-register-closures');
        const q = query(
          closuresRef,
          orderBy('fechaCorte', 'desc')
        );

        // Create the real-time listener
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const closures = [];

            snapshot.forEach((doc) => {
              const closureData = { id: doc.id, ...doc.data() };
              closures.push(closureData);
            });

            // First time: resolve the promise (loading → success)
            resolve(closures);

            // Subsequent updates: update cache directly (real-time updates)
            queryClient.setQueryData(['cashRegisterClosures'], closures);
          },
          (error) => {
            console.error('Error in cash register closures subscription:', error);
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
