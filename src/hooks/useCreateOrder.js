import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addOrder } from '../services/firebaseService';

/**
 * React Query mutation hook for creating orders
 *
 * Note: With Firestore real-time listeners, the cache updates automatically
 * via onSnapshot. Manual invalidation is optional but included for consistency.
 *
 * @returns {Object} React Query mutation result
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData) => addOrder(orderData),

    onSuccess: (docId) => {
      // Optional: Invalidate queries to ensure consistency
      // The onSnapshot listener will update automatically, but this ensures it
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },

    onError: (error) => {
      console.error('Failed to create order:', error);
    },
  });
}
