import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * Optimized for Firestore real-time subscriptions
 *
 * Key settings:
 * - No automatic refetching (we use onSnapshot for real-time updates)
 * - Infinite staleTime (data is always fresh via listeners)
 * - 30min cache retention after component unmount
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable automatic refetching - Firestore handles this via onSnapshot
      refetchOnWindowFocus: false,  // Real-time listeners already update data
      refetchOnReconnect: false,    // Firestore SDK handles reconnection
      refetchOnMount: false,        // Prevents duplicate reads on remount

      // Cache configuration
      staleTime: Infinity,          // Data never becomes stale (real-time updates)
      cacheTime: 1000 * 60 * 30,    // Keep in cache for 30 minutes after unmount

      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on permission errors
        if (error?.code === 'permission-denied') {
          return false;
        }
        // Don't retry on quota exceeded errors
        if (error?.code === 'resource-exhausted') {
          console.error('Firestore quota exceeded - stopping retries');
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },

      // Don't throw errors to error boundaries - handle locally
      useErrorBoundary: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});
