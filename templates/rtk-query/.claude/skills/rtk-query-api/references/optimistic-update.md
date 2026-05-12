# Optimistic updates

Use sparingly. Optimistic updates risk showing stale state to the user; only use when the success rate is very high (>99%) AND the perceived latency is meaningful.

## When to use

✅ Good fit:

- Toggling a boolean flag (favourited, archived, read/unread)
- Reordering a list (drag-and-drop)
- Inline editing of a single field with very low failure rate

❌ Bad fit:

- Financial transactions (NEVER show success before backend confirms)
- KYC submissions (regulatory + the value MIGHT be rejected by ML)
- Anything where the failure path is "value also gets rejected for other reasons we can't predict"

## Pattern — `onQueryStarted` with cache patch

```ts
toggleFavorite: builder.mutation<void, { id: string; isFavorite: boolean }>({
  query: ({ id, isFavorite }) => ({
    url: KYC_URLS.FAVORITE(id),
    method: PATCH,
    data: { isFavorite },
  }),
  async onQueryStarted({ id, isFavorite }, { dispatch, queryFulfilled }) {
    // Optimistic: patch the cached list entry
    const patch = dispatch(
      kycApi.util.updateQueryData('getKycList', undefined, (draft) => {
        const item = draft.items.find((x) => x.id === id);
        if (item) (item as { isFavorite: boolean }).isFavorite = isFavorite;
      }),
    );

    try {
      await queryFulfilled;
    } catch {
      // Rollback on failure
      patch.undo();
    }
  },
  invalidatesTags: (_, __, { id }) => [{ type: 'Kyc', id }],
}),
```

## Rules

1. ALWAYS roll back on failure (`patch.undo()`)
2. Still invalidate tags so the server's truth eventually wins
3. Don't show success toast optimistically — wait for `queryFulfilled`
4. Don't optimistically create new entries — wait for the server's ID assignment
