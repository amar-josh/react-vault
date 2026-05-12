# Cache strategies — when to use which tagging pattern

## Single-entity tag

When a feature has one type of resource:

```ts
tagTypes: ['Kyc'];
// queries: providesTags: ['Kyc']
// mutations: invalidatesTags: ['Kyc']
```

Simple. Every mutation refetches everything tagged `Kyc`. Fine for small lists.

## Per-record tags (id-scoped)

When the list is large and you want detail updates to NOT refetch the whole list:

```ts
providesTags: (result) =>
  result
    ? [
        ...result.items.map(({ id }) => ({ type: 'Kyc' as const, id })),
        { type: 'Kyc' as const, id: 'LIST' },
      ]
    : [{ type: 'Kyc' as const, id: 'LIST' }],

// Detail provides one tag:
providesTags: (_, __, id) => [{ type: 'Kyc', id }],

// Update mutation invalidates that one tag:
invalidatesTags: (_, __, { id }) => [{ type: 'Kyc', id }],

// Create mutation invalidates only the list:
invalidatesTags: [{ type: 'Kyc', id: 'LIST' }],
```

The `LIST` is a synthetic id used as the "any list" tag.

## Tag everything mutating affects (mutation joined with list)

When an update changes a derived list (e.g. updating a transaction affects account balance):

```ts
updateTransaction: builder.mutation({
  invalidatesTags: (_, __, { id }) => [
    { type: 'Transaction', id },
    { type: 'AccountBalance' },         // tag from a different api
  ],
}),
```

For cross-API invalidations, the target API must also be in the `tagTypes` registry or you need `invalidateCacheMiddleware` instead.

## Stale-while-revalidate

Default RTK Query behaviour — cached data shows immediately, refetch happens in background. To control:

```ts
getKycList: builder.query({
  query: ...,
  keepUnusedDataFor: 60,   // seconds after last subscriber unsubscribes
  refetchOnMountOrArgChange: 30, // seconds — refetch if cache > 30s old
}),
```

For audit-critical lists where staleness is unacceptable, set `keepUnusedDataFor: 0` so cache is wiped on unmount.

## Skip cache (force fresh)

Pass `{ refetchOnMountOrArgChange: true }` to a single hook call:

```tsx
const { data } = useGetKycListQuery(undefined, { refetchOnMountOrArgChange: true });
```

Use ONLY for sensitive views (audit log, balance display in transaction flow).

## Pagination + cache

When paginating, key the query by page so each page caches independently:

```ts
getKycList: builder.query<KycListResponse, { page: number; pageSize: number }>({
  query: (params) => ({ url: KYC_URLS.LIST, method: GET, data: params }),
  providesTags: (result, _, arg) =>
    result
      ? [
          ...result.items.map(({ id }) => ({ type: 'Kyc' as const, id })),
          { type: 'Kyc' as const, id: `PAGE-${arg.page}` },
        ]
      : [{ type: 'Kyc' as const, id: `PAGE-${arg.page}` }],
}),
```

This way refetching one page doesn't blow away the others.
