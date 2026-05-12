---
name: query-client-setup
description: Configure the TanStack QueryClient — defaults, retry policy, refetch behaviour, optional global error handlers, devtools. Use when setting up the QueryClient for the first time, adjusting retry / staleTime / refetch behaviour, adding a global error handler, or wiring devtools.
---

# QueryClient Setup

`src/api/queryClient.ts` exports a single `QueryClient` instance with BFSI-friendly defaults. It's mounted via `<QueryClientProvider>` in `src/app/App.tsx`.

## File map

```
src/api/
├── axiosInstance.ts    single axios for all services
├── http.ts             typed GET/POST/PUT/PATCH/DELETE helpers
└── queryClient.ts      QueryClient with defaultOptions
src/app/
└── App.tsx             wraps in <QueryClientProvider client={queryClient}>
```

## Default config (what the scaffolder ships)

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s — minimise thrash, refetch when stale
      gcTime: 5 * 60_000, // 5min — keep in cache after unsubscribed
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status;
        // Don't retry 4xx (except 408/429)
        if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // BFSI: don't refetch on tab switch
    },
    mutations: {
      retry: false, // Never auto-retry mutations
    },
  },
});
```

## Why these defaults

| Setting                       | Choice            | Reason                                                                                                              |
| ----------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| `staleTime: 30_000`           | 30 seconds        | Prevents thrash from rapid component remounts; long enough that two users on the same screen don't both hit the API |
| `gcTime: 5 * 60_000`          | 5 minutes         | Keeps caches around when user navigates back; cleared on logout via `queryClient.clear()`                           |
| `retry: 4xx → no`             | 4xx → no, 5xx → 2 | 4xx is a contract issue — retrying won't help. 5xx might be transient.                                              |
| `refetchOnWindowFocus: false` | off               | BFSI users tab away and back; surprise refetches lose draft state                                                   |
| `mutations.retry: false`      | never retry       | Mutations have side effects. Use idempotency-key + explicit user retry.                                             |

## Workflow — adjusting defaults

Don't override these in component-level `useQuery` calls unless you have a specific reason. Override the default once in `queryClient.ts`:

```ts
defaultOptions: {
  queries: {
    staleTime: 60_000,    // change to 60s
    // ...
  },
},
```

For a per-feature override:

```tsx
const { data } = useQuery({
  queryKey: kycKeys.list(filters),
  queryFn: () => getKycList(filters),
  staleTime: 0, // always refetch on mount (audit-critical list)
});
```

## Wiring into the app

`src/app/App.tsx` (variant overlay):

```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { AppRoutes } from '../routes';
import { queryClient } from '../api/queryClient';

export function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

Devtools render only in dev (gated by `import.meta.env.DEV`).

## Global error handlers (optional)

For a "catch all unhandled mutation errors" toast, use a `MutationCache`:

```ts
import { QueryClient, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toSafeView } from '@<scope>/core/compliance';
import type { ApiError } from '@<scope>/core/http';
import i18n from '@/i18n/i18n';

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (mutation.options.onError) return; // skip if per-mutation handler set
      const view = toSafeView(error as ApiError, i18n.t);
      toast.error(view.title, { description: view.description });
    },
  }),
  defaultOptions: {
    /* ... */
  },
});
```

See [`references/global-handlers.md`](references/global-handlers.md) for QueryCache + MutationCache patterns.

## Conventions enforced

- ❌ NEVER create multiple `QueryClient` instances — there must be exactly one for the app.
- ❌ NEVER set `refetchOnWindowFocus: true` globally (BFSI default is off).
- ❌ NEVER enable `mutations.retry > 0` globally — mutations have side effects.
- ❌ NEVER render `<ReactQueryDevtools>` in production builds — gate on `import.meta.env.DEV`.
- ✅ `<QueryClientProvider>` wraps the WHOLE app (above the router, below ErrorBoundary).
- ✅ Per-query overrides go in the `useQuery` call, not the QueryClient config.
- ✅ On logout: `queryClient.clear()` after `clearAuthToken()`.

## Logout sequence

```ts
import { clearAuthToken } from '@<scope>/core/http';
import { queryClient } from '@/api/queryClient';
import axiosInstance from '@/api/axiosInstance';

export function logout() {
  clearAuthToken(axiosInstance); // drop the auth header
  queryClient.clear(); // wipe all cached server data
  navigate('/login');
}
```

`queryClient.clear()` removes all cached queries + in-flight fetches. Without it, a re-login on the same browser sees stale data for a flash before refetch.

## References

- [`references/global-handlers.md`](references/global-handlers.md) — QueryCache.onError + MutationCache.onError patterns
- [`references/devtools.md`](references/devtools.md) — using ReactQueryDevtools effectively
