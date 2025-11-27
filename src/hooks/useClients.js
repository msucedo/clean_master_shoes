import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * React Query hook for real-time clients subscription
 *
 * Creates a SINGLE shared subscription to the clients collection
 *
 * @param {Object} options - Query options
 * @param {boolean} options.enabled - Whether the query is enabled (default: true)
 * @returns {Object} React Query result with clients array
 */
export function useClients(options = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['clients'],
    enabled,
    queryFn: () => {
      return new Promise((resolve, reject) => {
        const clientsRef = collection(db, 'clients');

        const unsubscribe = onSnapshot(
          clientsRef,
          (snapshot) => {
            const clients = [];
            snapshot.forEach((doc) => {
              clients.push({ id: doc.id, ...doc.data() });
            });

            // First time: resolve the promise
            resolve(clients);

            // Subsequent updates: update cache directly
            queryClient.setQueryData(['clients'], clients);
          },
          (error) => {
            console.error('Error in clients subscription:', error);
            reject(error);
          }
        );

        // Cleanup
        return () => unsubscribe();
      });
    },
  });
}
