---
name: axios-auth
description: Configure the project's axios instance, response interceptor, and RTK Query baseQuery. Sets the auth token ONCE at login via setAuthToken() (not per-request), with response interceptor for notifications + 401 redirect. Use when the user mentions axios, API client, baseQuery, set token, login flow, 401 handling, response interceptor, error notification.
---

# Axios + Auth Pattern

The HTTP layer is three files under `src/axiosconfig/` plus the auth-token helper from `@<scope>/core/http`. Tokens are set ONCE at login on the axios instance — not injected per-request via interceptor.

## File map

| File                               | Role                                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/axiosconfig/axiosInstance.ts` | Single shared `AxiosInstance` from `createAxios()`                                              |
| `src/axiosconfig/interceptor.ts`   | Response interceptor: notifications + 401 redirect. Side-effect import from `axiosInstance.ts`. |
| `src/axiosconfig/baseQuery.ts`     | `axiosBaseQuery()` for RTK Query — wraps the instance                                           |
| `@<scope>/core/http`               | Exports `createAxios`, `setAuthToken`, `clearAuthToken`, `ApiError`                             |

## Workflow

### Step 1 — Set token at login (the canonical place)

Inside your login mutation's success path:

```ts
import { setAuthToken } from '@<scope>/core/http';
import axiosInstance from '@/axiosconfig/axiosInstance';

// After login API returns { token, ... }:
setAuthToken(axiosInstance, response.token);
```

`setAuthToken` writes to `instance.defaults.headers.common.Authorization` (or whatever `authHeaderName` was set). Every subsequent request carries the header automatically — no per-request interceptor needed.

### Step 2 — Clear on logout / 401

`createAxios()` already wires this: when a response is 401, it auto-calls `clearAuthToken(instance)` then invokes the `onUnauthorized` callback (which redirects to `/login` in the scaffolded template).

Manual logout flow:

```ts
import { clearAuthToken } from '@<scope>/core/http';
import axiosInstance from '@/axiosconfig/axiosInstance';

clearAuthToken(axiosInstance);
// then dispatch any session-cleanup action and navigate
```

### Step 3 — Wire notification dispatch in the interceptor (optional)

The scaffolded `interceptor.ts` has commented-out placeholders for notification dispatch. When you set up a Notification slice, uncomment + adapt:

```ts
import store from '@/redux/store';
import { setNotification } from '@/shared/Notification/slice';

// inside the response error handler:
store.dispatch(setNotification({ type: 'error', message: extractMessage(err) }));
```

See [`references/notification-wiring.md`](references/notification-wiring.md) for the full pattern.

### Step 4 — Use `axiosBaseQuery` in feature APIs

```ts
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '@/axiosconfig/baseQuery';

export const fooApi = createApi({
  reducerPath: 'fooApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Foo'],
  endpoints: (builder) => ({
    /* ... */
  }),
});
```

Each endpoint can opt-in to success/error notifications via `showSuccessNotification` / `showFailureNotification` flags on the query object (rsense parity).

## Conventions enforced

- ❌ NEVER inject token via a `request.use` interceptor — use `setAuthToken` at login.
- ❌ NEVER read token from `localStorage` on every request.
- ❌ NEVER hardcode `Authorization: Bearer ...` anywhere.
- ✅ One axios instance per app — exported as the default from `axiosInstance.ts`.
- ✅ Side-effect import of `'./interceptor.js'` in `axiosInstance.ts` so response interceptors are always registered.
- ✅ All RTK Query APIs use `axiosBaseQuery()` (never the default `fetchBaseQuery`).

## Quick reference checklist

When adding API auth:

- [ ] Login mutation calls `setAuthToken(axiosInstance, token)` on success
- [ ] Logout / 401 path calls `clearAuthToken(axiosInstance)`
- [ ] Token never appears in `localStorage` (memory only, set on the instance)
- [ ] `onUnauthorized` callback in `axiosInstance.ts` redirects to `/login`

## References

- [`references/full-code-walkthrough.md`](references/full-code-walkthrough.md) — annotated walk through all three files in the scaffolded project
- [`references/notification-wiring.md`](references/notification-wiring.md) — how to wire `showSuccessNotification` / `showFailureNotification` flags to a Notification slice
- [`references/error-shape.md`](references/error-shape.md) — backend error contract (`ApiError` kinds, field-error format)
