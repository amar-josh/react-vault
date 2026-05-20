---
name: testing-patterns
description: Write Vitest + React Testing Library unit tests for an RTK Query feature — endpoints, query/mutation hooks, components reading from RTK Query, and slice reducers. Covers test-utils helpers (setupApiStore, createWrapper, renderWithProviders), mocking axios to drive RTK Query through the same baseQuery the app uses, and waiting on RTK Query state. Use when adding tests for a new feature, an RTK Query API, a slice, or any component that reads from RTK Query / useAppSelector.
---

# Testing Patterns (RTK Query variant)

The scaffolded project ships Vitest + React Testing Library wired into [vite.config.ts](../../../vite.config.ts). Tests are co-located with the file under test (`foo.ts` → `foo.test.ts`). Run with `pnpm test` (CI) or `pnpm test:watch` (dev).

## File map

```
src/
├── test-utils/
│   └── render.tsx       setupApiStore, createWrapper, renderWithProviders
└── features/<feature>/
    ├── api.ts                            createApi(...) — the unit under test
    ├── api.test.ts                       endpoint config: URL, method, transformResponse
    ├── slice.ts                          createSlice(...) — if you have one
    ├── slice.test.ts                     reducer behaviour
    ├── hooks/use<X>.test.tsx              wraps RTK Query auto-hooks (rare; usually test the api directly)
    └── components/<X>.test.tsx            component reads via useGetXQuery / useXMutation
```

## Per-test store, not the app store

**Never** import `@/redux/store` in a test. Each test builds its own store via `setupApiStore({ apis: [kycApi] })`. This:

- Avoids RTK Query cache leakage across tests
- Lets each test register only the APIs/slices it needs
- Makes failures isolated and reproducible

## The four kinds of test (one per layer)

### 1. Slice (`slice.test.ts`) — pure reducer, no React

```ts
import { describe, expect, it } from 'vitest';
import authReducer, { tokenSet, loggedOut } from './slice';

it('stores the token on tokenSet', () => {
  const next = authReducer(undefined, tokenSet('abc'));
  expect(next.token).toBe('abc');
});

it('clears state on loggedOut', () => {
  const next = authReducer({ token: 'abc' }, loggedOut());
  expect(next.token).toBeNull();
});
```

Reducer tests are pure functions — call directly, assert on the next state. Skip RTL entirely.

### 2. API endpoint (`api.test.ts`) — drive RTK Query through the axios baseQuery

The cleanest way to test an RTK Query endpoint is end-to-end through the real `axiosBaseQuery`, with the underlying axios instance mocked. That covers `transformResponse`, `providesTags`, `invalidatesTags`, and the request shape in a single test.

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/axiosconfig/axiosInstance', () => ({
  default: vi.fn(),
}));

import axiosInstance from '@/axiosconfig/axiosInstance';
import { setupApiStore } from '@/test-utils/render';
import { kycApi } from './api';

const mockedAxios = vi.mocked(axiosInstance);
beforeEach(() => vi.clearAllMocks());

it('getKycList builds GET /kyc and returns the envelope', async () => {
  mockedAxios.mockResolvedValueOnce({ data: { items: [], total: 0 } } as never);
  const { store } = setupApiStore({ apis: [kycApi] });

  const result = await store.dispatch(kycApi.endpoints.getKycList.initiate());

  expect(mockedAxios).toHaveBeenCalledWith(expect.objectContaining({ url: '/kyc', method: 'GET' }));
  expect(result.data).toEqual({ items: [], total: 0 });
});

it('submitKyc POSTs the payload and invalidates the list', async () => {
  mockedAxios
    .mockResolvedValueOnce({ data: { id: 'k1', status: 'pending' } } as never) // submit
    .mockResolvedValueOnce({ data: { items: [], total: 0 } } as never); // refetch after invalidate
  const { store } = setupApiStore({ apis: [kycApi] });

  // Seed the list so we can observe the refetch
  await store.dispatch(kycApi.endpoints.getKycList.initiate());
  await store.dispatch(kycApi.endpoints.submitKyc.initiate({ pan: 'AAAPL1234C', aadhaar: '1234' }));

  // Two GETs (initial + refetch after invalidate) + one POST
  const methods = mockedAxios.mock.calls.map(([cfg]) => (cfg as { method?: string }).method);
  expect(methods).toContain('POST');
});
```

Key points:

- The axios instance is a **callable** (axios returns a function from `axios.create()`), so mock the default export as `vi.fn()`, not as an object with `.get/.post`.
- Resolve with `{ data: <envelope> }` — `axiosBaseQuery` reads `result.data`.
- `store.dispatch(api.endpoints.X.initiate(args))` runs the same code path the app does; you don't need to call `useGetXQuery` from a component.

### 3. Component (`components/X.test.tsx`) — `renderWithProviders` + user-event

```tsx
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/axiosconfig/axiosInstance', () => ({ default: vi.fn() }));

import axiosInstance from '@/axiosconfig/axiosInstance';
import { renderWithProviders } from '@/test-utils/render';
import { kycApi } from '../api';
import { KycList } from './KycList';

const mockedAxios = vi.mocked(axiosInstance);
beforeEach(() => vi.clearAllMocks());

it('renders the list after the query resolves', async () => {
  mockedAxios.mockResolvedValueOnce({
    data: { items: [{ id: 'k1', status: 'pending' }], total: 1 },
  } as never);

  renderWithProviders(<KycList />, { apis: [kycApi] });

  expect(await screen.findByText(/k1/i)).toBeInTheDocument();
});

it('shows the empty state when the list is empty', async () => {
  mockedAxios.mockResolvedValueOnce({ data: { items: [], total: 0 } } as never);

  renderWithProviders(<KycList />, { apis: [kycApi] });

  expect(await screen.findByText(/no kyc records/i)).toBeInTheDocument();
});
```

Key points:

- Pass the feature's `kycApi` (and any slices) into `renderWithProviders({ apis, slices })` — those are the only ones registered in the test's store.
- Use `findBy*` for elements that appear after the query resolves; `getBy*` for synchronous content.
- Query by accessible role/label, not test IDs.

### 4. Hook (`hooks/useX.test.tsx`) — usually unnecessary

RTK Query generates `useGetXQuery` / `useXMutation` from the api spec. There's nothing custom to test there. If you've written a **wrapper hook** that adds behaviour (debouncing, derived state, side effects), use `renderHook` + `createWrapper`:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '@/test-utils/render';
import { kycApi } from '../api';
import { useKycDebouncedSearch } from './useKycDebouncedSearch';

it('debounces the query and surfaces the result', async () => {
  const { wrapper } = createWrapper({ apis: [kycApi] });
  const { result, rerender } = renderHook((q: string) => useKycDebouncedSearch(q), {
    wrapper,
    initialProps: '',
  });
  rerender('amar');
  await waitFor(() => expect(result.current.data).toBeDefined());
});
```

## What to test (and what not to)

| Layer     | Test these                                                                               | Don't test these                                  |
| --------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Slice     | Each reducer case, edge cases (loggedOut when state was undefined)                       | Redux Toolkit itself                              |
| API       | Endpoint URL + method, payload shape, transformResponse, invalidation triggers a refetch | RTK Query internals (cache eviction timing, etc.) |
| Component | User can see/interact with the rendered data; empty/error/loading states                 | Component CSS, internal state                     |
| Auto-hook | (skip — covered by API tests)                                                            |                                                   |

## Conventions enforced

- ❌ NEVER import `@/redux/store` in a test — build a per-test store via `setupApiStore`.
- ❌ NEVER call a real axios instance in unit tests — mock `@/axiosconfig/axiosInstance` (it's a callable, mock as `vi.fn()`).
- ❌ NEVER assert on `state.api.queries[...]` directly — use `store.dispatch(endpoints.X.initiate(...))` and read `result.data`/`result.error`.
- ❌ NEVER assert on internal CSS or refs. Assert on what a user can see/do.
- ✅ One `beforeEach(() => vi.clearAllMocks())` per `describe`.
- ✅ Always `await waitFor(...)` (or `findBy*`) before reading data; queries are async.
- ✅ Mock the layer immediately below the unit under test, never deeper. API test mocks axios; component test mocks axios (so the RTK Query path runs end-to-end through the store).

## Adding your first test

When you scaffold a new RTK Query feature, add these tests in order — each is faster than the next:

1. `slice.test.ts` (if you have a slice)
2. `api.test.ts` — endpoints + invalidation
3. `components/X.test.tsx` — the consumer pages

By the time the feature is "done", every layer has at least one test.
