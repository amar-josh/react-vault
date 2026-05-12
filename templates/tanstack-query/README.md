# Template: TanStack Query variant

Overlay applied on top of `templates/_shared/` when the user picks **TanStack Query**.

## What this overlay adds

- `@tanstack/react-query` + `@tanstack/react-query-devtools` + `zustand` dependencies
- `src/api/queryClient.ts` — pre-configured `QueryClient` with BFSI-friendly defaults
- `src/api/httpClient.ts` — axios instance from `@rsense/bfsi-core/http`

## Feature pattern

```ts
// src/features/Foo/api.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/api/httpClient';
import { fooResponseSchema, type FooQuery, type FooBody } from './schema';

const FOO_KEY = ['foo'] as const;

export function useGetFoo(arg: FooQuery) {
  return useQuery({
    queryKey: [...FOO_KEY, arg],
    queryFn: async () => {
      const { data } = await http.get('/foo', { params: arg });
      return fooResponseSchema.parse(data);
    },
  });
}

export function useCreateFoo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: FooBody) => {
      const { data } = await http.post('/foo', body);
      return fooResponseSchema.parse(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FOO_KEY }),
  });
}
```

Scaffold a new feature: `/bfsi-feature MyFeature` (variant auto-detected as TanStack).

## Why Zustand for client state?

TanStack Query handles **server state** beautifully but isn't suited for **client state**
(UI state, drafts, ephemeral selections). Zustand is the lightweight pick: small, no
Provider, TypeScript-friendly. Use it for:

- Local UI state that needs to survive route changes
- Form drafts (in concert with React Hook Form)
- Cross-component selections (selected rows, filters)

Don't use Zustand for server data — that's what TanStack Query is for.
