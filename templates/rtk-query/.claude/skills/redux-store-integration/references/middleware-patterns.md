# Cross-API cache invalidation patterns

When `invalidatesTags` on a single endpoint isn't enough — typically because the mutation in API A should invalidate caches in API B that's not coupled to A's tagTypes.

## Pattern: One mutation invalidates many APIs

```ts
import type { Middleware } from '@reduxjs/toolkit';
import authApi from '@/features/Auth/api';
import userApi from '@/features/User/api';
import permissionsApi from '@/features/Permissions/api';

const invalidateCacheMiddleware: Middleware = (storeApi) => (next) => (action) => {
  // Login → re-fetch user profile + permissions
  if (authApi.endpoints.login.matchFulfilled(action)) {
    storeApi.dispatch(userApi.util.invalidateTags(['User']));
    storeApi.dispatch(permissionsApi.util.invalidateTags(['Permission']));
  }

  return next(action);
};
```

## Pattern: Conditional invalidation

```ts
if (kycApi.endpoints.submitKyc.matchFulfilled(action)) {
  const newStatus = action.payload?.status;
  if (newStatus === 'approved') {
    storeApi.dispatch(accountsApi.util.invalidateTags(['Account']));
  }
}
```

## Pattern: Reset on logout

```ts
if (authApi.endpoints.logout.matchFulfilled(action)) {
  storeApi.dispatch(kycApi.util.resetApiState());
  storeApi.dispatch(transactionsApi.util.resetApiState());
  storeApi.dispatch(userApi.util.resetApiState());
}
```

`resetApiState` wipes all cached data for that API — safer than tag invalidation on logout because it also clears in-flight queries.

## Pattern: matchAny for grouped events

```ts
import { isAnyOf } from '@reduxjs/toolkit';

const matchAnyMutation = isAnyOf(
  kycApi.endpoints.submitKyc.matchFulfilled,
  kycApi.endpoints.approveKyc.matchFulfilled,
  kycApi.endpoints.rejectKyc.matchFulfilled,
);

if (matchAnyMutation(action)) {
  storeApi.dispatch(auditApi.util.invalidateTags(['AuditEvent']));
}
```

## Anti-pattern: invalidate inside endpoints' `onQueryStarted`

Tempting but bad: it couples the source API to the target. Prefer middleware so the source API stays unaware. Easier to grep for invalidations (one file) and easier to test.

## Order matters

In `store.ts`, register `invalidateCacheMiddleware` BEFORE the feature APIs' middleware:

```ts
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware().concat([
    invalidateCacheMiddleware,    // first
    authApi.middleware,
    userApi.middleware,
    kycApi.middleware,
    // ...
  ]),
```

This way the invalidation middleware sees the fulfilled action BEFORE the API's own subscription dispatches a refetch, avoiding a brief stale window.
