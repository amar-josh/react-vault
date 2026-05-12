---
name: tanstack-services
description: Create the service layer for a feature — typed async functions that wrap the HTTP helpers (GET/POST/PUT/PATCH/DELETE) and return parsed responses. Services are hook-free and consumed by useQuery / useMutation in components. Use when adding a new feature's services, adding a new service to an existing feature, or wiring API endpoints.
---

# TanStack Services

Every feature has a service file at `src/services/<feature>.ts` (or `src/features/<Feature>/service.ts`). Services are plain async functions: typed inputs in, typed parsed output out. No hooks. No React.

## File map (typical feature)

```
src/features/<Feature>/
├── service.ts          typed async functions
├── schema.ts           Zod schemas (request + response)
├── types.ts            inferred types from Zod
├── containers/...      React components that call services via useQuery/useMutation
```

## Workflow — new feature service

### Step 1 — Define schemas

`src/features/Kyc/schema.ts`:

```ts
import { z } from 'zod';
import { PAN_REGEX, AADHAAR_REGEX } from '@/utils/constants/regexConstants';

export const kycRecordSchema = z.object({
  id: z.string(),
  pan: z.string().regex(PAN_REGEX),
  aadhaar: z.string().regex(AADHAAR_REGEX),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdAt: z.coerce.date(),
});

export const kycListResponseSchema = z.object({
  items: z.array(kycRecordSchema),
  total: z.number().int().nonnegative(),
});

export const kycSubmitRequestSchema = z.object({
  pan: z.string().regex(PAN_REGEX),
  aadhaar: z.string().regex(AADHAAR_REGEX),
});
```

Types are inferred — never hand-write:

```ts
// types.ts
import { z } from 'zod';
import type { kycRecordSchema, kycListResponseSchema, kycSubmitRequestSchema } from './schema';

export type IKycRecord = z.infer<typeof kycRecordSchema>;
export type IKycListResponse = z.infer<typeof kycListResponseSchema>;
export type IKycSubmitRequest = z.infer<typeof kycSubmitRequestSchema>;
```

### Step 2 — Write services

`src/features/Kyc/service.ts`:

```ts
import { GET, POST } from '@/api/http';
import { KYC_URLS } from '@/utils/constants/urlConstants';
import { kycRecordSchema, kycListResponseSchema } from './schema';
import type { IKycRecord, IKycListResponse, IKycSubmitRequest } from './types';

export const getKycList = async (): Promise<IKycListResponse> => {
  const raw = await GET<unknown>(KYC_URLS.LIST);
  return kycListResponseSchema.parse(raw);
};

export const getKycDetail = async (id: string): Promise<IKycRecord> => {
  const raw = await GET<unknown>(KYC_URLS.DETAIL(id));
  return kycRecordSchema.parse(raw);
};

export const submitKyc = async (payload: IKycSubmitRequest): Promise<IKycRecord> => {
  const raw = await POST<unknown, IKycSubmitRequest>(KYC_URLS.SUBMIT, payload);
  return kycRecordSchema.parse(raw);
};
```

### Step 3 — Use in components

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kycKeys } from '@/utils/constants/queryKeys';
import { getKycList, getKycDetail, submitKyc } from './service';

function KycList() {
  const { data, isLoading, error } = useQuery({
    queryKey: kycKeys.lists(),
    queryFn: getKycList,
  });
  // ...
}

function KycForm() {
  const queryClient = useQueryClient();
  const submit = useMutation({
    mutationFn: submitKyc,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.all });
    },
  });
  // ...
}
```

## Conventions enforced

- ❌ NEVER use `axios.<method>` directly — use the typed `GET<TRes, TParams>` / `POST<TRes, TReq>` helpers from `@/api/http`.
- ❌ NEVER skip the `.parse()` step — every response goes through Zod validation at runtime.
- ❌ NEVER inline a URL string — use `urlConstants.ts`.
- ❌ NEVER call services without typing the response — the generic on `GET<IResponse>` is required.
- ❌ NEVER put React hooks in service files — services are pure async functions.
- ✅ One service file per feature; export named async functions.
- ✅ Request types prefixed `I` (`IKycSubmitRequest`) to match service interface convention.
- ✅ Responses parsed by Zod schemas from the same feature's `schema.ts`.
- ✅ Use `getX` / `submitX` / `updateX` / `deleteX` naming for service functions.

## Service vs hook

A service is a plain function: `getKyc(id): Promise<IKycRecord>`.

A hook wraps it with TanStack Query: `useQuery({ queryKey: kycKeys.detail(id), queryFn: () => getKyc(id) })`.

Don't pre-bundle the hook into the service. Keep services hook-free so:

- They're trivial to unit test (call them directly with mocked axios)
- The component decides cache behaviour (staleTime, refetch, enabled, etc.)
- The same service can power useQuery, useMutation, OR a direct call outside a component (rare but useful — e.g. in a logout flow)

## References

- [`references/service-cookbook.md`](references/service-cookbook.md) — list, detail, paginated, file-upload, file-download, polling examples
- [`references/optimistic-update.md`](references/optimistic-update.md) — optimistic mutations with cache patches
- [`references/audited-mutation.md`](references/audited-mutation.md) — wrapping useMutation to fire audit events
