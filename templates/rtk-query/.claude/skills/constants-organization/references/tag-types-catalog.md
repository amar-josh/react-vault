# Tag types catalog

RTK Query uses tag types for cache invalidation. Each feature picks ONE tag type per entity it manages.

## Naming

- Singular, PascalCase: `User`, `Kyc`, `Transaction`, `Loan`
- One tag per logical entity, not per endpoint
- A single tag covers list + detail of the same entity

## Provides vs invalidates

| Endpoint       | Use                                                           | Why                                                                |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| `getKycList`   | `providesTags: ['Kyc']`                                       | Reads → marks the cache as having Kyc data                         |
| `getKycDetail` | `providesTags: (_, _, id) => [{ type: 'Kyc', id }]`           | Read for one — tagged with the id so detail invalidates separately |
| `submitKyc`    | `invalidatesTags: ['Kyc']`                                    | Mutation → invalidates ALL Kyc-tagged caches (list refetches)      |
| `approveKyc`   | `invalidatesTags: (_, _, id) => [{ type: 'Kyc', id }, 'Kyc']` | Per-record + list                                                  |

## Cross-feature invalidation

When a mutation in feature A should invalidate caches in feature B, two patterns:

### Pattern 1 — Tag both features

```ts
// transactionsApi.ts
endpoints: (builder) => ({
  createTransaction: builder.mutation({
    query: ...,
    invalidatesTags: ['Transaction', 'AccountBalance'],
  }),
}),
```

If both `Transaction` and `AccountBalance` are tag types provided by their respective APIs, both refetch.

### Pattern 2 — Middleware-driven

Use the `invalidateCacheMiddleware` (in `src/redux/`). When `transactionsApi.endpoints.create.matchFulfilled(action)` fires, dispatch invalidation on another API:

```ts
store.dispatch(accountsApi.util.invalidateTags(['AccountBalance']));
```

Use Pattern 2 when there's a chain (one mutation affects N caches) and listing them all in `invalidatesTags` becomes noisy.

## Anti-patterns

- ❌ A tag per endpoint (`KycList`, `KycDetail`, `KycSubmit`) — proliferates without benefit
- ❌ Forgetting `as const` on the array — types degrade to `string[]`
- ❌ Same tag name across multiple APIs without sharing — invalidations don't cross
- ❌ String-typed tag references instead of using the exported `TagType` union
