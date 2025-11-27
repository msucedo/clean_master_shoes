import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteOrder } from '../services/firebaseService';

/**
 * React Query mutation hook for deleting orders
 *
 * Note: With Firestore real-time listeners, the cache updates automatically
 * via onSnapshot. Manual invalidation is optional but included for consistency.
 *
 * @returns {Object} React Query mutation result
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId) => deleteOrder(orderId),

    onSuccess: () => {
      // Optional: Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },

    onError: (error) => {
      console.error('Failed to delete order:', error);
    },
  });
}
