---
name: constants-organization
description: Where each kind of constant lives in the project and how to add a new one. Covers URL endpoint constants, HTTP method constants, route paths, RTK Query tag types, validation regex patterns, and app-wide constants. Use when adding a new endpoint URL, route path, tag type, validation regex, or any other shared constant.
---

# Constants Organisation

Constants are split across files by purpose. Each kind has one home — don't scatter.

## File map

```
src/utils/constants/
├── apiConstants.ts       HTTP method names, API version, base URL helpers
├── appConstants.ts       App-wide enums (ERROR / SUCCESS, storage keys, etc.)
├── urlConstants.ts       Every API endpoint URL string
├── routeConstants.ts     Every router path
├── tagTypes.ts           RTK Query cache tag type names
└── regexConstants.ts     Reusable validation regex
```

## When to use which

| Adding …                     | Goes in             | Naming convention                              |
| ---------------------------- | ------------------- | ---------------------------------------------- |
| A backend endpoint URL       | `urlConstants.ts`   | `<FEATURE>_URLS.<ACTION>` or `<FEATURE>_URL`   |
| A frontend route path        | `routeConstants.ts` | `ROUTES.<feature>.<view>` or `<FEATURE>_ROUTE` |
| An HTTP method (GET/POST/…)  | `apiConstants.ts`   | `GET`, `POST` constants                        |
| An RTK Query tag type        | `tagTypes.ts`       | `<Feature>Tag` literal in array                |
| A validation regex           | `regexConstants.ts` | `<FIELD>_REGEX`                                |
| A storage key                | `appConstants.ts`   | `<PURPOSE>_KEY`                                |
| An enum value used > 1 place | `appConstants.ts`   | `<NAME>` (UPPER_SNAKE)                         |

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
3. Reference from the feature's `api.ts`:
   ```ts
   import { KYC_URLS } from '@/utils/constants/urlConstants';
   ```
4. If this endpoint introduces a new tag type, add it to `tagTypes.ts` and to the feature API's `tagTypes` array.

See [`references/example-files.md`](references/example-files.md) for full file templates.

## Workflow — adding a new route

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

Always centralise — never inline a regex in a Zod schema.

1. Open `src/utils/constants/regexConstants.ts`.
2. Add with documentation:
   ```ts
   // PAN: 5 letters + 4 digits + 1 letter
   export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
   ```
3. Use in Zod:

   ```ts
   import { PAN_REGEX } from '@/utils/constants/regexConstants';

   const schema = z.object({
     pan: z.string().regex(PAN_REGEX, { message: 'Invalid PAN' }),
   });
   ```

The starter's `@<scope>/core/pii` already exports `PII_PATTERNS` with common BFSI regexes (PAN, Aadhaar, IFSC, mobile, email, etc.). Re-export those from `regexConstants.ts` rather than redefining.

## Conventions enforced

- ❌ NEVER hardcode a URL string in `api.ts` — always reference `urlConstants.ts`.
- ❌ NEVER inline a regex in component code or schema — always via `regexConstants.ts`.
- ❌ NEVER use a magic string for tag types — always via `tagTypes.ts`.
- ✅ Group by feature within each constants file (e.g. `KYC_URLS`, `LOAN_URLS`).
- ✅ Use `as const` on the exported objects so TypeScript infers literal types.
- ✅ Functions for dynamic paths (`DETAIL: (id) => ...`), strings for static ones.

## References

- [`references/example-files.md`](references/example-files.md) — full templates for each constants file
- [`references/tag-types-catalog.md`](references/tag-types-catalog.md) — RTK Query tag type naming + when each is invalidated
