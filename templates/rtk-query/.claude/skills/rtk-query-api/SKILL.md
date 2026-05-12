---
name: rtk-query-api
description: 'Create RTK Query API files for Rails-backed React apps. Covers createApi setup with custom axiosBaseQuery, CRUD endpoints (builder.query/mutation), tagTypes for cache invalidation, auto-notification on mutations, typed request/response interfaces, and hook exports. Use when: creating API layer, adding endpoints, RTK Query, data fetching, cache invalidation, api.ts file.'
---

# RTK Query API Pattern

## Overview

Every feature module has an `api.ts` file that defines all data-fetching logic using RTK Query's `createApi`. This eliminates manual loading/error state management, provides automatic caching, and integrates with a custom `axiosBaseQuery` that handles auth tokens and notifications.

## File Structure

```
src/features/{Domain}/{Feature}/api.ts
```

## Complete Pattern

```typescript
import { createApi } from '@reduxjs/toolkit/query/react';

import axiosBaseQuery from '@/axiosconfig/baseQuery';

import { GET, POST, PUT, DELETE } from '@/utils/constants/apiConstants';
import { FEATURE_ENDPOINTS } from '@/utils/constants/urlConstant';
import { API_TAG_TYPES } from '@/utils/constants/apiTagTypeConstants';

// Import typed interfaces from the feature's .d.ts file
import {
  IFeatureItem,
  IFeatureListResponse,
  IFeatureDetailResponse,
  ICreateFeatureRequest,
  IUpdateFeatureRequest,
} from './Feature.d';

// Destructure endpoints from URL constants
const { FETCH_LIST, CREATE, FETCH_DETAIL, UPDATE, DELETE_ITEM } = FEATURE_ENDPOINTS;
const { FEATURE_LIST } = API_TAG_TYPES;

const featureApi = createApi({
  // Unique key in Redux store - must match rootReducer registration
  reducerPath: 'featureApi',

  // Custom axios-based query function (handles auth headers, interceptors)
  baseQuery: axiosBaseQuery(),

  // Cache tag types for automatic invalidation
  tagTypes: [FEATURE_LIST],

  endpoints: (builder) => ({
    // ---- QUERIES (GET requests) ----

    // Fetch list - provides cache tag
    fetchFeatureList: builder.query<IFeatureListResponse, void>({
      query: () => ({
        url: FETCH_LIST,
        method: GET,
      }),
      providesTags: [FEATURE_LIST],
    }),

    // Fetch single item by UID
    fetchFeatureDetail: builder.query<IFeatureDetailResponse, { uid: string }>({
      query: ({ uid }) => ({
        url: `${FETCH_DETAIL}/${uid}`,
        method: GET,
      }),
    }),

    // Fetch dropdown/select options (common for forms)
    fetchFeatureDropdown: builder.query<IFeatureListResponse, void>({
      query: () => ({
        url: FETCH_LIST,
        method: GET,
      }),
    }),

    // ---- MUTATIONS (POST/PUT/DELETE) ----

    // Create - invalidates list cache, shows success notification
    createFeature: builder.mutation<IFeatureDetailResponse, ICreateFeatureRequest>({
      query: (data) => ({
        url: CREATE,
        method: POST,
        data,
        showSuccesNotification: true, // triggers toast via baseQuery
      }),
      invalidatesTags: [FEATURE_LIST],
    }),

    // Update - invalidates list cache
    updateFeature: builder.mutation<IFeatureDetailResponse, IUpdateFeatureRequest>({
      query: ({ uid, ...data }) => ({
        url: `${UPDATE}/${uid}`,
        method: PUT,
        data,
        showSuccesNotification: true,
      }),
      invalidatesTags: [FEATURE_LIST],
    }),

    // Delete - invalidates list cache
    deleteFeature: builder.mutation<IFeatureDetailResponse, string>({
      query: (uid) => ({
        url: `${DELETE_ITEM}/${uid}`,
        method: DELETE,
        showSuccesNotification: true,
      }),
      invalidatesTags: [FEATURE_LIST],
    }),
  }),
});

// Export auto-generated hooks for use in containers
export const {
  useFetchFeatureListQuery,
  useFetchFeatureDetailQuery,
  useFetchFeatureDropdownQuery,
  useCreateFeatureMutation,
  useUpdateFeatureMutation,
  useDeleteFeatureMutation,
} = featureApi;

// Default export for store/rootReducer registration
export default featureApi;
```

## Key Rules

### Naming Conventions

- `reducerPath`: camelCase ending in `Api` (e.g., `bankAccountApi`, `departmentsApi`)
- Query hooks: `useFetch{Feature}{Action}Query` or `use{Action}Query`
- Mutation hooks: `use{Action}{Feature}Mutation` or `use{Action}Mutation`
- Tag types: SCREAMING_SNAKE from `apiTagTypeConstants.ts`

### baseQuery Notification Flags

The custom `axiosBaseQuery` supports two boolean flags on any endpoint config:

- `showSuccesNotification: true` - dispatches success toast on 2xx response
- `showFailureNotification: true` - dispatches error toast on failure
- Mutations typically set `showSuccesNotification: true`
- Queries typically set neither (silent fetch)

### Cache Invalidation Strategy

- Every query that returns a list provides a tag: `providesTags: [TAG_NAME]`
- Every mutation that changes data invalidates: `invalidatesTags: [TAG_NAME]`
- For cross-API invalidation, use the `invalidateCacheMiddleware` (see Redux Store Integration skill)
- Use `skipToken` from RTK Query to conditionally skip queries:
  ```typescript
  const { data } = useFetchDetailQuery(isModalOpen ? { uid } : skipToken);
  ```

### Conditional/Lazy Queries

```typescript
import { skipToken } from '@reduxjs/toolkit/query';

// Only fetch when modal is open AND we have an ID
const { data } = useFetchFeatureDetailQuery(
  isModalOpen && selectedId ? { uid: selectedId } : skipToken,
);
```

### GET Requests with Params

For GET requests, pass data as `params` (axiosBaseQuery handles this automatically when method is GET):

```typescript
fetchFiltered: builder.query<IResponse, IFilterParams>({
  query: (data) => ({
    url: FETCH_URL,
    method: GET,
    data, // axiosBaseQuery converts to query params for GET
  }),
}),
```

### Response Type Override

For file downloads or blob responses:

```typescript
downloadReport: builder.mutation<Blob, { uid: string }>({
  query: ({ uid }) => ({
    url: `${DOWNLOAD_URL}/${uid}`,
    method: GET,
    responseType: "blob",
  }),
}),
```

## After Creating api.ts

You MUST register the new API in two files:

1. `src/redux/rootReducer.ts` - add `[featureApi.reducerPath]: featureApi.reducer`
2. `src/redux/store.ts` - add `featureApi.middleware` to middleware array

See the **Redux Store Integration** skill for details.

## Type Definition Pattern

Create a `.d.ts` file alongside `api.ts`:

```typescript
// Feature.d.ts
export interface IFeatureItem {
  uid: string;
  attributes: {
    name: string;
    code: string;
    // ... feature-specific fields
  };
}

export interface IFeatureListResponse {
  data: IFeatureItem[];
  message?: string;
}

export interface IFeatureDetailResponse {
  data: IFeatureItem;
  message?: string;
  success?: boolean;
}

export interface ICreateFeatureRequest {
  name: string;
  code: string;
}

export interface IUpdateFeatureRequest extends ICreateFeatureRequest {
  uid: string;
}
```
