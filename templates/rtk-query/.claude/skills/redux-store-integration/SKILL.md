---
name: redux-store-integration
description: 'Wire new RTK Query APIs and Redux slices into the store. Covers registering API reducers in rootReducer.ts, adding middleware in store.ts, creating Redux slices with createSlice, cross-API cache invalidation middleware, typed hooks (useAppDispatch/useAppSelector), and localStorage persistence. Use when: registering new API, adding slice, store setup, cache invalidation, middleware, Redux integration.'
---

# Redux Store Integration

## Overview

The Redux store has three integration points when adding new features:

1. `rootReducer.ts` - register API reducer + optional slice reducer
2. `store.ts` - register API middleware
3. `invaliadteCacheMiddleware.ts` - cross-API cache invalidation (when needed)

## Registering a New RTK Query API

### Step 1: rootReducer.ts

```typescript
// src/redux/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit';

// ... existing imports ...
import featureApi from '@/features/{Domain}/{Feature}/api';

const rootReducer = combineReducers({
  // Traditional slices (UI state)
  login: loginReducer,
  sidebar: sidebarReducer,
  notification: notificationReducer,
  message: messageReducer,
  tools: toolsReducer,
  systemConstants: systemConstantsReducer,
  programLevelCourses: programLevelCoursesReducer,

  // RTK Query API reducers (computed key from reducerPath)
  // ... existing API reducers ...
  [featureApi.reducerPath]: featureApi.reducer, // ADD THIS
});

export default rootReducer;
```

### Step 2: store.ts

```typescript
// src/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// ... existing imports ...
import featureApi from '@/features/{Domain}/{Feature}/api';

const store = configureStore({
  reducer: rootReducer,
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      invalidateCacheMiddleware,
      // ... existing API middlewares ...
      featureApi.middleware, // ADD THIS
    ]),
  devTools: true,
});

setupListeners(store.dispatch);
```

## Creating a Redux Slice (for local UI state)

Only create slices for state that needs to persist across components (not for API data - RTK Query handles that).

```typescript
// src/features/{Domain}/{Feature}/slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface IFeatureState {
  selectedTab: string;
  isExpanded: boolean;
}

const initialState: IFeatureState = {
  selectedTab: 'active',
  isExpanded: false,
};

const featureSlice = createSlice({
  name: 'feature',
  initialState,
  reducers: {
    setSelectedTab: (state, action: PayloadAction<string>) => {
      state.selectedTab = action.payload;
    },
    toggleExpanded: (state) => {
      state.isExpanded = !state.isExpanded;
    },
    resetFeatureState: () => initialState,
  },
});

export const { setSelectedTab, toggleExpanded, resetFeatureState } = featureSlice.actions;
export const featureReducer = featureSlice.reducer;
```

Register the slice in `rootReducer.ts`:

```typescript
import { featureReducer } from '@/features/{Domain}/{Feature}/slice';

const rootReducer = combineReducers({
  feature: featureReducer, // ADD under traditional slices section
  // ... rest
});
```

## Typed Redux Hooks

Always use the typed hooks from `src/redux/reduxHooks.ts`:

```typescript
import { useAppDispatch, useAppSelector } from '@/redux/reduxHooks';
import { RootState } from '@/redux/store';

// In a container:
const dispatch = useAppDispatch();
const { attributes } = useAppSelector((state: RootState) => state.login.data);
const { selectedTab } = useAppSelector((state: RootState) => state.feature);

// Dispatching actions:
dispatch(setSelectedTab('draft'));
```

## Cross-API Cache Invalidation Middleware

When a mutation in one API should invalidate cache in another API (e.g., creating a department should refresh the department dropdown used by another feature), use the `invalidateCacheMiddleware`:

```typescript
// src/redux/invaliadteCacheMiddleware.ts

// The middleware watches for fulfilled mutations and invalidates tags across APIs:
const invalidateCacheMiddleware = (storeAPI: any) => (next: any) => (action: any) => {
  const result = next(action);

  // Example: When department list changes, invalidate department dropdowns in other APIs
  if (action.type?.endsWith('/fulfilled')) {
    const tagType = action.meta?.arg?.type;

    // Map tag types to APIs that need invalidation
    const crossApiInvalidations: Record<string, Array<{ api: any; tags: string[] }>> = {
      [DEPARTMENT_LIST]: [
        { api: departmentsApi, tags: [DEPARTMENT_DROPDOWN_LIST] },
        { api: programApi, tags: [PROGRAM_LIST] },
      ],
      [UNIVERSITY]: [{ api: educationalUnitApi, tags: [EDUCATIONAL_UNIT_LIST] }],
    };

    // Perform cross-API invalidation
    const invalidations = crossApiInvalidations[tagType];
    if (invalidations) {
      invalidations.forEach(({ api, tags }) => {
        tags.forEach((tag) => {
          storeAPI.dispatch(api.util.invalidateTags([tag]));
        });
      });
    }
  }

  return result;
};
```

## Manual Cache Invalidation (from containers)

Sometimes you need to manually invalidate another API's cache from a container:

```typescript
import { useAppDispatch } from '@/redux/reduxHooks';
import departmentsApi from '@/features/Settings/Departments/api';

const dispatch = useAppDispatch();

// After a successful mutation:
dispatch(departmentsApi.util.invalidateTags(['departmentList']));
```

## localStorage Persistence

The login state is persisted to localStorage automatically via store subscription:

```typescript
// In store.ts:
store.subscribe(() => {
  local.setItem(LOGGED_IN_USER, store.getState().login);
});

// Restored on startup:
const preloadedState = {
  login: local.getItem(LOGGED_IN_USER) || initialState,
};
```

## Key Rules

1. Every RTK Query API needs BOTH reducer in `rootReducer.ts` AND middleware in `store.ts`
2. Use `[api.reducerPath]: api.reducer` syntax (computed property) in rootReducer
3. Only create slices for UI state that must persist across component unmounts
4. Always use typed hooks (`useAppDispatch`, `useAppSelector`) - never raw `useDispatch`/`useSelector`
5. Cross-API invalidation goes in the middleware, not in individual containers
6. Only `login` state is persisted to localStorage - other state is ephemeral
