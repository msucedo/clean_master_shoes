import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrder } from '../services/firebaseService';

/**
 * React Query mutation hook for updating orders
 *
 * Note: With Firestore real-time listeners, the cache updates automatically
 * via onSnapshot. Manual invalidation is optional but included for consistency.
 *
 * @returns {Object} React Query mutation result
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, updates }) => updateOrder(orderId, updates),

    onSuccess: () => {
      // Optional: Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },

    onError: (error) => {
      console.error('Failed to update order:', error);
    },
  });
}
