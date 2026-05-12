---
name: redux-store-integration
description: Wire a new RTK Query API or Redux slice into the store. Covers registering reducers in rootReducer.ts, appending middleware in store.ts, using typed hooks (useAppDispatch / useAppSelector), and cross-API cache invalidation. Use when the user just scaffolded a new feature's api.ts or slice.ts and needs to plug it into the store, or asks about cache invalidation middleware, typed hooks, or Redux wiring.
---

# Redux Store Integration

After scaffolding a new feature with an `api.ts` (RTK Query) or `slice.ts` (regular Redux), you have to register it in TWO places. Both are tiny but easy to forget.

## File map

```
src/redux/
├── store.ts                       configureStore + middleware concat
├── rootReducer.ts                 combineReducers (slices + API reducers)
├── reduxHooks.ts                  typed useAppDispatch / useAppSelector
└── invalidateCacheMiddleware.ts   cross-API cache invalidation rules
```

## Workflow — adding an RTK Query API

### Step 1 — Register the reducer

Open `src/redux/rootReducer.ts`:

```ts
import { combineReducers } from '@reduxjs/toolkit';
import kycApi from '@/features/Kyc/api';

const rootReducer = combineReducers({
  [kycApi.reducerPath]: kycApi.reducer,
});

export default rootReducer;
```

Use `[api.reducerPath]` as the key — never a hardcoded string. The `reducerPath` is set inside `createApi({ reducerPath: 'kycApi', ... })`.

### Step 2 — Append the middleware

Open `src/redux/store.ts`:

```ts
import kycApi from '@/features/Kyc/api';

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat([kycApi.middleware]),
  devTools: true,
});
```

Without this, RTK Query won't intercept the API's actions. Symptoms: queries fire but cache never updates, subscriptions don't trigger refetch.

### Step 3 — Use the API in components

```tsx
import { useGetKycListQuery } from '@/features/Kyc/api';
import { useAppDispatch, useAppSelector } from '@/redux/reduxHooks';

function KycList() {
  const { data, isLoading, error } = useGetKycListQuery();
  // ...
}
```

NEVER use plain `useDispatch` / `useSelector` directly — use the typed hooks. They give you `RootState` autocomplete + `AppDispatch` action types.

## Workflow — adding a regular Redux slice

### Step 1 — Create the slice

In `src/features/<Feature>/slice.ts`:

```ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface FeatureState {
  selectedId: string | null;
  filters: Record<string, unknown>;
}

const initialState: FeatureState = { selectedId: null, filters: {} };

const featureSlice = createSlice({
  name: 'feature',
  initialState,
  reducers: {
    setSelected: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    },
    setFilters: (state, action: PayloadAction<Record<string, unknown>>) => {
      state.filters = action.payload;
    },
    reset: () => initialState,
  },
});

export const { setSelected, setFilters, reset } = featureSlice.actions;
export const featureReducer = featureSlice.reducer;
```

### Step 2 — Register

In `src/redux/rootReducer.ts`:

```ts
import { featureReducer } from '@/features/Feature/slice';

const rootReducer = combineReducers({
  feature: featureReducer,
});
```

No middleware step for plain slices (they go through `getDefaultMiddleware` automatically).

## Cross-API cache invalidation

When mutation in one API should invalidate another API's cache, use `src/redux/invalidateCacheMiddleware.ts`:

```ts
import type { Middleware } from '@reduxjs/toolkit';
import kycApi from '@/features/Kyc/api';
import userApi from '@/features/User/api';

const invalidateCacheMiddleware: Middleware = (storeApi) => (next) => (action) => {
  if (kycApi.endpoints.submitKyc.matchFulfilled(action)) {
    storeApi.dispatch(userApi.util.invalidateTags(['User']));
  }
  return next(action);
};

export default invalidateCacheMiddleware;
```

Make sure `invalidateCacheMiddleware` is included in `store.ts`'s middleware concat array.

See [`references/middleware-patterns.md`](references/middleware-patterns.md) for common invalidation patterns.

## Conventions enforced

- ❌ NEVER import `useDispatch` / `useSelector` from `react-redux` — use `useAppDispatch` / `useAppSelector` from `reduxHooks`.
- ❌ NEVER hardcode an API's reducerPath as a string in `rootReducer.ts` — use `[api.reducerPath]`.
- ❌ NEVER skip the middleware registration — leads to silent cache-bust failures.
- ✅ Register middleware in the order: `invalidateCacheMiddleware` first, then feature APIs.
- ✅ Slices live next to their feature (`src/features/<Feature>/slice.ts`).
- ✅ Each API has a unique `reducerPath`; never share.

## Checklist when wiring a new feature

- [ ] Reducer registered in `rootReducer.ts`
- [ ] Middleware appended in `store.ts` (if it's an API)
- [ ] Containers use `useAppDispatch` / `useAppSelector` (typed)
- [ ] Cross-API invalidations added to `invalidateCacheMiddleware.ts` (if any)

## References

- [`references/middleware-patterns.md`](references/middleware-patterns.md) — common cross-API invalidation patterns
- [`references/localStorage-persistence.md`](references/localStorage-persistence.md) — pattern for persisting a slice to localStorage
