import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * React Query hook for real-time employees subscription
 *
 * Creates a SINGLE shared subscription to the employees collection
 *
 * @param {Object} options - Query options
 * @param {boolean} options.enabled - Whether the query is enabled (default: true)
 * @returns {Object} React Query result with employees array
 */
export function useEmployees(options = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['employees'],
    enabled,
    queryFn: () => {
      return new Promise((resolve, reject) => {
        const employeesRef = collection(db, 'employees');

        const unsubscribe = onSnapshot(
          employeesRef,
          (snapshot) => {
            const employees = [];
            snapshot.forEach((doc) => {
              employees.push({ id: doc.id, ...doc.data() });
            });

            // First time: resolve the promise
            resolve(employees);

            // Subsequent updates: update cache directly
            queryClient.setQueryData(['employees'], employees);
          },
          (error) => {
            console.error('Error in employees subscription:', error);
            reject(error);
          }
        );

        // Cleanup
        return () => unsubscribe();
      });
    },
  });
}
