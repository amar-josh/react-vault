# Template: TanStack Query variant

Overlay applied on top of `templates/_shared/` when the user picks **TanStack Query**.

## Adds

- `@tanstack/react-query` + devtools + `zustand` deps
- `src/api/axiosInstance.ts` — single shared axios instance from `@<projectName>/core/http`
- `src/api/http.ts` — typed `GET<TRes, TParams>`, `POST<TRes, TReq>`, `PUT`, `PATCH`, `DELETE` helpers
- `src/api/queryClient.ts` — `QueryClient` with BFSI defaults (30s stale, no focus refetch, no mutation retry)
- `src/services/example.ts` — reference service showing the `IRequest`/`IResponse` pattern
- `src/app/App.tsx` — overlays \_shared App with `<QueryClientProvider>`

## Service-method pattern (vs RTK Query's dispatch style)

You call services directly — no hooks, no dispatch:

```ts
// src/services/kyc.ts
import { POST, GET } from '@/api/http';

export interface IKycRequest {
  pan: string;
  aadhaar: string;
}
export interface IKycResponse {
  id: string;
  status: 'pending' | 'approved';
}

export const submitKyc = (payload: IKycRequest): Promise<IKycResponse> =>
  POST<IKycResponse, IKycRequest>('/kyc', payload);

export const getKyc = (id: string): Promise<IKycResponse> => GET<IKycResponse>(`/kyc/${id}`);
```

Inside components, wire with hooks:

```tsx
import { useMutation, useQuery } from '@tanstack/react-query';
import { submitKyc, getKyc } from '@/services/kyc';

const submit = useMutation({ mutationFn: submitKyc });
const detail = useQuery({ queryKey: ['kyc', id], queryFn: () => getKyc(id) });
```

## Auth: set-once at login

The axios instance has no per-request token interceptor. Set the token once at login:

```ts
import { setAuthToken } from '@your-real-scope/core/http';
import axiosInstance from '@/api/axiosInstance';

// inside login mutation onSuccess:
setAuthToken(axiosInstance, response.token);
```

On 401, the instance's `onUnauthorized` callback clears the token and redirects to `/login`.

## Why Zustand for client state

TanStack Query owns **server state** (fetches, caches, invalidation). Use Zustand for **client state** (UI state surviving route changes, form drafts, cross-component selections). Don't use Zustand for server data — that's what TanStack Query is for.
