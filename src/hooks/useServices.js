import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * React Query hook for real-time services subscription
 *
 * Creates a SINGLE shared subscription to the services collection
 *
 * @param {Object} options - Query options
 * @param {boolean} options.enabled - Whether the query is enabled (default: true)
 * @returns {Object} React Query result with services array
 */
export function useServices(options = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['services'],
    enabled,
    queryFn: () => {
      return new Promise((resolve, reject) => {
        const servicesRef = collection(db, 'services');

        const unsubscribe = onSnapshot(
          servicesRef,
          (snapshot) => {
            const services = [];
            snapshot.forEach((doc) => {
              services.push({ id: doc.id, ...doc.data() });
            });

            // First time: resolve the promise
            resolve(services);

            // Subsequent updates: update cache directly
            queryClient.setQueryData(['services'], services);
          },
          (error) => {
            console.error('Error in services subscription:', error);
            reject(error);
          }
        );

        // Cleanup
        return () => unsubscribe();
      });
    },
  });
}
