/**
 * TanStack Query client — minimal scaffold.
 *
 * Apps wrap App in <QueryClientProvider client={queryClient}>.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Sensible BFSI defaults: minimise stale data, but don't thrash.
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        // Don't retry 4xx (except 408/429)
        const status = (error as { status?: number })?.status;
        if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // BFSI: don't refetch on tab switch — user's choice
    },
    mutations: {
      retry: false, // mutations should not auto-retry (use idempotency-key + manual retry)
    },
  },
});
