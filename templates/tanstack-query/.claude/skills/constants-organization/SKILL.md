---
name: constants-organization
description: Where each kind of constant lives in the project and how to add a new one. Covers URL endpoint constants, HTTP method usage, route paths, queryKey conventions, validation regex patterns, and app-wide constants. Use when adding a new endpoint URL, route path, queryKey, validation regex, or any other shared constant.
---

# Constants Organisation (TanStack variant)

Constants are split across files by purpose. Each kind has one home — don't scatter.

## File map

```
src/utils/constants/
├── appConstants.ts       App-wide enums (ERROR / SUCCESS, storage keys, etc.)
├── urlConstants.ts       Every API endpoint URL string
├── routeConstants.ts     Every router path
├── queryKeys.ts          TanStack Query queryKey factories
└── regexConstants.ts     Reusable validation regex
```

## When to use which

| Adding …                     | Goes in             | Naming convention                                   |
| ---------------------------- | ------------------- | --------------------------------------------------- |
| A backend endpoint URL       | `urlConstants.ts`   | `<FEATURE>_URLS.<ACTION>` or `<FEATURE>_URL`        |
| A frontend route path        | `routeConstants.ts` | `ROUTES.<feature>.<view>`                           |
| A TanStack queryKey          | `queryKeys.ts`      | `<feature>Keys.list()` / `<feature>Keys.detail(id)` |
| A validation regex           | `regexConstants.ts` | `<FIELD>_REGEX`                                     |
| A storage key                | `appConstants.ts`   | `<PURPOSE>_KEY`                                     |
| An enum value used > 1 place | `appConstants.ts`   | `<NAME>` (UPPER_SNAKE)                              |

## Workflow — adding a new endpoint

1. Open `src/utils/constants/urlConstants.ts`.
2. Add to the appropriate feature block (or create one):
   ```ts
   export const KYC_URLS = {
     LIST: '/kyc',
     DETAIL: (id: string) => `/kyc/${id}`,
     SUBMIT: '/kyc/submit',
   } as const;
   ```
3. Reference from the feature's service:

   ```ts
   import { KYC_URLS } from '@/utils/constants/urlConstants';
   import { GET } from '@/api/http';

   export const getKycList = () => GET<IKycListResponse>(KYC_URLS.LIST);
   ```

## Workflow — adding a queryKey

TanStack Query queryKeys are arrays that uniquely identify cached data. Always go through a queryKey factory — never inline the array. This keeps invalidation patterns DRY and refactor-safe.

`src/utils/constants/queryKeys.ts`:

```ts
export const kycKeys = {
  all: ['kyc'] as const,
  lists: () => [...kycKeys.all, 'list'] as const,
  list: (filters?: KycFilters) => [...kycKeys.lists(), filters] as const,
  details: () => [...kycKeys.all, 'detail'] as const,
  detail: (id: string) => [...kycKeys.details(), id] as const,
};
```

Usage:

```tsx
// Component
const { data } = useQuery({
  queryKey: kycKeys.list(filters),
  queryFn: () => getKycList(filters),
});

// Invalidation
queryClient.invalidateQueries({ queryKey: kycKeys.all }); // all KYC
queryClient.invalidateQueries({ queryKey: kycKeys.lists() }); // all lists
queryClient.invalidateQueries({ queryKey: kycKeys.detail(id) }); // one record
```

See [`references/query-key-factories.md`](references/query-key-factories.md) for the full pattern + invalidation matrix.

## Workflow — adding a route

1. Open `src/utils/constants/routeConstants.ts`.
2. Add the path:
   ```ts
   export const ROUTES = {
     kyc: {
       list: '/kyc',
       detail: '/kyc/:id',
       submit: '/kyc/submit',
     },
   } as const;
   ```
3. Wire it in `src/routes/index.tsx`:
   ```tsx
   <Route
     path={ROUTES.kyc.list}
     element={
       <ProtectedRoute permission="kyc.view">
         <KycList />
       </ProtectedRoute>
     }
   />
   ```

## Workflow — adding a validation regex

Centralise — never inline.

```ts
// src/utils/constants/regexConstants.ts
export { PII_PATTERNS } from '@<scope>/core/pii';
import { PII_PATTERNS } from '@<scope>/core/pii';

export const PAN_REGEX = PII_PATTERNS.pan;
export const AADHAAR_REGEX = PII_PATTERNS.aadhaar;
export const MOBILE_REGEX = PII_PATTERNS.mobileIndia;
export const IFSC_REGEX = PII_PATTERNS.ifsc;
```

Use in Zod:

```ts
import { PAN_REGEX } from '@/utils/constants/regexConstants';
const schema = z.object({ pan: z.string().regex(PAN_REGEX) });
```

## Conventions enforced

- ❌ NEVER hardcode a URL string in a service — always reference `urlConstants.ts`.
- ❌ NEVER inline a queryKey array — always use a key factory from `queryKeys.ts`.
- ❌ NEVER inline a regex in component code or schema — always via `regexConstants.ts`.
- ✅ Group by feature within each constants file (e.g. `KYC_URLS`, `LOAN_URLS`; `kycKeys`, `loanKeys`).
- ✅ Use `as const` on the exported objects so TypeScript infers literal types.
- ✅ Functions for dynamic paths (`DETAIL: (id) => ...`), strings for static ones.

## References

- [`references/example-files.md`](references/example-files.md) — full templates for each constants file
- [`references/query-key-factories.md`](references/query-key-factories.md) — queryKey factory pattern + invalidation matrix
