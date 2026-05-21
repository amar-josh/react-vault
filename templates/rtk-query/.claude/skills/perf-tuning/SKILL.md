---
name: perf-tuning
description: RTK Query + Redux Toolkit performance tuning for the RTK variant — cache-lifetime config (`keepUnusedDataFor`, `refetchOnFocus`, `refetchOnReconnect`), polling control, Reselect memoisation with `createSelector`, middleware checks disabled in production, subscription deduplication, optimistic updates via `onQueryStarted`, and prefetching. Use when adding a perf-sensitive endpoint, debugging RTK Query refetches, tuning the store middleware, or pairing with virtualisation.
---

# RTK Query Performance Tuning

Pairs with the toolkit-wide [`bfsi-perf-react`](../../../../../packages/claude-toolkit/skills/bfsi-perf-react/SKILL.md) reference. This skill is RTK-Query-specific.

## Cache lifetime per endpoint

RTK Query caches by `endpoint + serialised args`. Defaults work for most reads; tune when the access pattern doesn't fit.

```ts
endpoints: (builder) => ({
  getTransactions: builder.query<TxnList, TxnQuery>({
    query: (q) => ({ url: URLS.TRANSACTIONS, params: q }),
    transformResponse: (r) => txnListSchema.parse(r),
    providesTags: (result) =>
      result ? [...result.items.map(({ id }) => ({ type: 'Txn' as const, id })), { type: 'Txn', id: 'LIST' }] : [{ type: 'Txn', id: 'LIST' }],

    keepUnusedDataFor: 120,    // seconds; default 60. Bump for expensive queries the user might revisit.
    refetchOnFocus: false,     // default false. Set true for time-sensitive data (balance).
    refetchOnReconnect: true,  // default false. Generally desirable for BFSI — network blips happen.
    refetchOnMountOrArgChange: false, // default false. Set to a number (seconds) to refetch if data is older than N.
  }),
}),
```

Per-endpoint tuning guide:

| Data type                             | `keepUnusedDataFor` | `refetchOnFocus` | `refetchOnMountOrArgChange` |
| ------------------------------------- | ------------------- | ---------------- | --------------------------- |
| Reference data (currencies, branches) | 3600 (1h)           | false            | false                       |
| Transaction list                      | 60                  | true             | 30                          |
| Account balance                       | 30                  | true             | 5                           |
| User profile                          | 600                 | false            | false                       |
| Audit log (admin)                     | 0                   | true             | 0 (always fresh)            |

## Polling — opt-in, not default

RTK Query supports per-subscription polling:

```ts
const { data } = useGetBalanceQuery(undefined, {
  pollingInterval: 5_000,
  skipPollingIfUnfocused: true, // pause when tab hidden
});
```

Rules:

- **Never poll < 5s** for anything non-critical. The render + JSON-stringify + scrub cost adds up.
- **`skipPollingIfUnfocused: true`** is mandatory for anything beyond on-screen tickers. Saves battery + cost.
- **Stop polling on error backoff** — RTK Query doesn't do this automatically. Track consecutive failures, increase the interval (or stop and toast).
- For high-frequency tickers: don't use RTK Query polling. Use a WebSocket-backed `useSyncExternalStore` (see [`bfsi-perf-real-time`](../../../../../packages/claude-toolkit/skills/bfsi-perf-real-time/SKILL.md)).

## Reselect — memoised selectors

Compose selectors that filter / sort / group large lists with `createSelector`:

```ts
import { createSelector } from '@reduxjs/toolkit';

const selectTxnApi = (state: RootState) => state.txnApi;

export const selectVisibleTransactions = createSelector(
  [
    (state: RootState) => state.filters.txnFilter,
    (state: RootState) => txnApi.endpoints.getTransactions.select(undefined)(state).data,
  ],
  (filter, txns) => {
    if (!txns) return [];
    return txns.items.filter((t) => matches(filter, t));
  },
);
```

Reselect rules:

- **Memo is by reference, not value.** If your input selector returns a new array reference each call, the memo cache is useless.
- **`createSelector` caches the LAST call only by default.** If two components call the selector with different args alternately, you get cache thrashing. Use `createSelector.withTypes<RootState>()` + `lruMemoize` or `weakMapMemoize` (RTK 2.0+) for multi-cache scenarios.
- **Don't put expensive work in the input selectors.** Inputs run on every call to check whether outputs are stale.
- **Profile** with the React DevTools Profiler. If a memo'd selector is recomputing every render, an input is unstable.

## Store middleware in production

`@reduxjs/toolkit` adds three middleware in dev that are expensive at large state sizes: `immutableCheck`, `serializableCheck`, `actionCreatorCheck`. They're auto-disabled in production builds, but verify:

```ts
// src/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer,
  middleware: (getDefault) =>
    getDefault({
      // Defaults: true (dev) / false (prod). Verify your bundler tree-shakes this in prod.
      immutableCheck: process.env.NODE_ENV !== 'production' && { warnAfter: 64 },
      serializableCheck: process.env.NODE_ENV !== 'production' && { warnAfter: 128 },
      actionCreatorCheck: process.env.NODE_ENV !== 'production',
    }).concat(txnApi.middleware, kycApi.middleware /* ... */),
});
```

If a feature legitimately needs non-serialisable state (Date, File, FormData), allowlist instead of disabling globally:

```ts
serializableCheck: {
  ignoredActionPaths: ['payload.file'],
  ignoredPaths: ['kyc.uploadFile'],
},
```

## Subscription deduplication

RTK Query dedupes by `endpoint + args` at the cache key level — 10 components calling `useGetBalanceQuery()` open one network request. But the SELECTORS run per-component. For lists of 200 rows each calling `useGetTransactionQuery({ id })`, that's 200 cache lookups per render.

Fixes:

- **Load the LIST once, render rows from the list** — don't load per-row.
- For prefetch-on-hover patterns, use `dispatch(api.util.prefetch('getTransaction', id))` instead of `useGetTransactionQuery(id)`.

## Optimistic updates

For mutations where the UI should reflect the change before the server confirms (toggling a notification preference, marking a message read):

```ts
toggleNotificationPref: builder.mutation<void, { id: string; enabled: boolean }>({
  query: ({ id, enabled }) => ({
    url: `${URLS.NOTIFICATIONS}/${id}`,
    method: 'PATCH',
    body: { enabled },
  }),
  onQueryStarted: async ({ id, enabled }, { dispatch, queryFulfilled }) => {
    const patch = dispatch(
      api.util.updateQueryData('getNotifications', undefined, (draft) => {
        const item = draft.find((n) => n.id === id);
        if (item) item.enabled = enabled;
      }),
    );
    try {
      await queryFulfilled;
    } catch {
      patch.undo();
    }
  },
}),
```

**Audit pairing** (BFSI requirement): for state changes, audit on success only — don't audit the optimistic stub. `useAuditedMutation` should fire `onQueryStarted` AFTER `queryFulfilled` resolves, not before.

## Prefetching

For predictable user journeys, prefetch the next screen's data while the user is finishing the current screen:

```tsx
// On row hover, prefetch the detail view's data
function TransactionRow({ txn }: { txn: Transaction }) {
  const prefetch = api.usePrefetch('getTransactionDetail');
  return (
    <tr
      onMouseEnter={() => prefetch(txn.id, { ifOlderThan: 60 })}
      onClick={() => navigate(`/transactions/${txn.id}`)}
    >
      ...
    </tr>
  );
}
```

`ifOlderThan: 60` means "prefetch only if the cache is missing or > 60s old". Default behaviour (omitted) is "always prefetch", which can be wasteful.

Don't prefetch on every hover for cheap items — set a debounce or use `ifOlderThan`.

## Cache invalidation discipline

The toolkit's existing skill `redux-store-integration` covers tag types and cross-API invalidation middleware. For perf, two rules:

- **Invalidate the smallest tag possible.** `{ type: 'Txn', id: 'LIST' }` refetches the list; `{ type: 'Txn', id: 'abc' }` refetches one row. Don't invalidate `'LIST'` if you only changed one row.
- **Tag every list with both `LIST` and per-item.** Then a per-item mutation can choose: invalidate just that item (refetches one row) or the list (refetches everything).

## Storage / hydration

If using `redux-persist`:

- **Whitelist** specifically, don't persist everything. Persisting an `api` slice with 50 MB of cached responses bloats `localStorage` and slows boot.
- **Throttle writes** (default 0 = every change). Set `throttle: 500` to write at most every 500 ms.
- **Don't persist sensitive data** — auth tokens go in memory (per the toolkit's auth rules), not in `localStorage`.

## Measuring

- React DevTools Profiler → "Why did this render?" — for unexpected re-renders.
- Redux DevTools → "Trace" tab — see which dispatch caused which state change.
- Network tab → filter by `XHR` → see whether expected dedupe is happening.
- `pnpm dlx vite-bundle-visualizer` — RTK + your APIs should be ~30-50 KB gzipped total. If they're > 100 KB, you're shipping too many endpoint definitions in one chunk.

## When to break a rule

- **Eager refetch on focus** for true compliance dashboards where staleness can mislead (operational risk).
- **Persist the api slice** if your users have weak networks and your data is heavy — boot from cache, refetch in background.
- **Skip polling, use SSE** for anything truly real-time (rates, fraud alerts). Polling is fine up to ~5s; below that switch transports.

## References

- RTK Query docs — https://redux-toolkit.js.org/rtk-query/usage/customizing-queries
- Reselect docs — https://github.com/reduxjs/reselect
- `bfsi-perf-react` (toolkit-wide) — for the surrounding methodology
- `bfsi-perf-real-time` (toolkit-wide) — for WebSocket / SSE patterns
- Existing variant skill `rtk-query-api` — for the endpoint-definition basics
