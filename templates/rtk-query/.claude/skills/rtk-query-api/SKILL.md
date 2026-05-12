---
name: rtk-query-api
description: Create an RTK Query API file for a feature. Covers createApi with axiosBaseQuery, query/mutation endpoints, tagTypes for cache invalidation, opt-in success/error notifications, typed request/response interfaces with Zod parse, and exported React hooks. Use when adding a new feature's api.ts, adding endpoints to an existing API, or wiring tag types.
---

# RTK Query API

Every feature has an `api.ts` at `src/features/<Feature>/api.ts`. It uses `createApi` with the project's `axiosBaseQuery` and exposes auto-generated React hooks.

## File map (typical feature)

```
src/features/<Feature>/
├── api.ts             createApi + endpoints
├── schema.ts          Zod schemas (request + response)
├── types.ts           inferred types from Zod
├── constants.ts       cache tag references + audit event names
└── containers/...
```

## Workflow — new feature API

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

Types are inferred — never hand-write them:

```ts
// types.ts
import { z } from 'zod';
import type { kycRecordSchema, kycListResponseSchema, kycSubmitRequestSchema } from './schema';

export type KycRecord = z.infer<typeof kycRecordSchema>;
export type KycListResponse = z.infer<typeof kycListResponseSchema>;
export type KycSubmitRequest = z.infer<typeof kycSubmitRequestSchema>;
```

### Step 2 — Create the API

`src/features/Kyc/api.ts`:

```ts
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '@/axiosconfig/baseQuery';
import { KYC_URLS } from '@/utils/constants/urlConstants';
import { GET, POST } from '@/utils/constants/apiConstants';
import { kycRecordSchema, kycListResponseSchema } from './schema';
import type { KycListResponse, KycSubmitRequest, KycRecord } from './types';

const kycApi = createApi({
  reducerPath: 'kycApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Kyc'],
  endpoints: (builder) => ({
    getKycList: builder.query<KycListResponse, void>({
      query: () => ({ url: KYC_URLS.LIST, method: GET }),
      transformResponse: (raw: unknown) => kycListResponseSchema.parse(raw),
      providesTags: ['Kyc'],
    }),
    getKycDetail: builder.query<KycRecord, string>({
      query: (id) => ({ url: KYC_URLS.DETAIL(id), method: GET }),
      transformResponse: (raw: unknown) => kycRecordSchema.parse(raw),
      providesTags: (_, __, id) => [{ type: 'Kyc', id }],
    }),
    submitKyc: builder.mutation<KycRecord, KycSubmitRequest>({
      query: (body) => ({
        url: KYC_URLS.SUBMIT,
        method: POST,
        data: body,
        showSuccessNotification: true,
        showFailureNotification: true,
      }),
      transformResponse: (raw: unknown) => kycRecordSchema.parse(raw),
      invalidatesTags: ['Kyc'],
    }),
  }),
});

export const { useGetKycListQuery, useGetKycDetailQuery, useSubmitKycMutation } = kycApi;
export default kycApi;
```

### Step 3 — Register in the store

See the `redux-store-integration` skill: register `kycApi.reducer` in `rootReducer.ts` and `kycApi.middleware` in `store.ts`.

### Step 4 — Use the hooks

```tsx
import { useGetKycListQuery, useSubmitKycMutation } from '@/features/Kyc/api';

function KycList() {
  const { data, isLoading, error } = useGetKycListQuery();
  const [submit] = useSubmitKycMutation();
  // ...
}
```

## Conventions enforced

- ❌ NEVER use `fetchBaseQuery` — always `axiosBaseQuery()` (so notifications/auth/interceptors apply).
- ❌ NEVER skip `transformResponse: schema.parse` — every response must validate at runtime.
- ❌ NEVER hand-write request/response types — infer from Zod.
- ❌ NEVER inline a URL string — use `urlConstants.ts`.
- ❌ NEVER inline a method string — use `apiConstants.ts` (`GET`, `POST`, …).
- ✅ One `reducerPath` per feature API (kebab → camelCase: `kycApi`, `loanApi`).
- ✅ Mutations always set `showFailureNotification: true`. Queries usually don't.
- ✅ `tagTypes` from `tagTypes.ts` catalog (see constants-organization skill).
- ✅ Audit-sensitive mutations also dispatch audit events (see the toolkit's `bfsi-audit-action` skill).

## Notification flags

```ts
showSuccessNotification: true; // success path dispatches toast
showFailureNotification: true; // error path dispatches toast
```

Both default to `false` — opt-in per endpoint. Read by `axiosBaseQuery` and routed through your Notification slice (see the `axios-auth` skill's notification-wiring reference).

## References

- [`references/endpoint-cookbook.md`](references/endpoint-cookbook.md) — list, detail, create, update, delete, paginated, polling, file-upload examples
- [`references/optimistic-update.md`](references/optimistic-update.md) — when and how to do optimistic UI updates with `onQueryStarted`
- [`references/cache-strategies.md`](references/cache-strategies.md) — `providesTags` / `invalidatesTags` patterns by feature shape
