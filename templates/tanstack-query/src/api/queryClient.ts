/**
 * TanStack Query client with BFSI-friendly defaults:
 *   - 30s stale time (don't thrash refetching)
 *   - No refetch on focus (user's choice, not surprise)
 *   - Don't retry 4xx (except 408/429)
 *   - Mutations never auto-retry (use idempotency-key + explicit retry)
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status;
        if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
