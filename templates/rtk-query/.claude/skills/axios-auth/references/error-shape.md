# Error shape contract

The HTTP layer normalises errors so feature code can pattern-match instead of digging through raw axios errors.

## `ApiError` (from `@<scope>/core/http`)

```ts
class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly ref?: string;
  readonly fieldErrors?: Record<string, string>;
}

type ApiErrorKind =
  | 'network' // no response, offline, connection refused
  | 'timeout' // request exceeded timeout
  | 'unauthorized' // 401
  | 'forbidden' // 403
  | 'not_found' // 404
  | 'conflict' // 409
  | 'validation' // 422 — fieldErrors populated
  | 'rate_limited' // 429
  | 'server_error' // 5xx
  | 'cancelled' // user cancelled / abort signal
  | 'unknown';
```

`createAxios` attaches an error-mapping interceptor that converts every axios error into `ApiError`. Inside `axiosBaseQuery`, you'll catch this — re-throw is fine; RTK Query stores it in `endpoint.error`.

## Backend error envelope

The starter's `axiosBaseQuery` expects backends to return errors as:

```json
{
  "errors": [{ "detail": "Email is already taken" }]
}
```

Or for field-level (422):

```json
{
  "errors": {
    "email": ["is already taken"],
    "password": ["is too short"]
  }
}
```

If your backend uses a different shape, override `extractMessage()` in `interceptor.ts` and adjust `axiosBaseQuery`'s error branch.

## Surfacing errors in containers

```tsx
import type { ApiError } from '@<scope>/core/http';

const [createFoo, { error, isError }] = useCreateFooMutation();

if (isError && error) {
  const e = error as ApiError;
  if (e.kind === 'validation' && e.fieldErrors) {
    // Set field-level errors on RHF:
    for (const [field, msg] of Object.entries(e.fieldErrors)) {
      form.setError(field as keyof FormValues, { message: msg });
    }
  } else if (e.kind === 'unauthorized') {
    // Already handled by axios's onUnauthorized — no action needed.
  } else {
    // Generic toast — interceptor handles this if showFailureNotification was true.
  }
}
```

## NEVER expose to UI

Per the `bfsi-error-message` reference skill in the toolkit:

- ❌ `error.message` from raw axios — leaks "Network Error" / stack info
- ❌ `error.response.data.errors` raw — may contain SQL fragments, DB IDs
- ❌ HTTP status codes as user copy ("Error 500")

Use the safe-error mapping (`toSafeView` from `@<scope>/core/compliance`) to convert `ApiError.kind` into a user-facing toast title + description + ref code.
