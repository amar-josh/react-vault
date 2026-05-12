# Template: RTK Query variant

Overlay applied on top of `templates/_shared/` when the user picks **RTK Query**.

## Structure (mirrors rsense-react-org)

```
src/
├── axiosconfig/
│   ├── axiosInstance.ts          # single shared axios instance
│   ├── interceptor.ts            # response interceptor (notifications, 401)
│   └── baseQuery.ts              # axiosBaseQuery for RTK Query
├── redux/
│   ├── store.ts                  # configureStore + middleware concat
│   ├── rootReducer.ts            # combineReducers (slices + API reducers)
│   ├── reduxHooks.ts             # typed useAppDispatch / useAppSelector
│   └── invalidateCacheMiddleware.ts  # cross-API tag invalidation
└── app/
    └── App.tsx                   # overlays _shared App with <Provider>
```

## Auth: set-once at login

Tokens are set on the axios instance ONCE at login (rsense pattern, not per-request):

```ts
import { setAuthToken } from '@your-real-scope/core/http';
import axiosInstance from '@/axiosconfig/axiosInstance';

// inside loginApi's onQueryStarted or login slice:
setAuthToken(axiosInstance, response.token);
```

On 401, the instance's `onUnauthorized` callback clears the token and redirects to `/login`.

## Feature pattern

```ts
// src/features/Foo/api.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '@/axiosconfig/baseQuery';
import { fooResponseSchema } from './schema';
import type { FooResponse, FooQuery, FooBody } from './types';

const fooApi = createApi({
  reducerPath: 'fooApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Foo'],
  endpoints: (builder) => ({
    getFoos: builder.query<FooResponse, FooQuery>({
      query: (arg) => ({ url: '/foo', method: 'GET', data: arg }),
      transformResponse: (raw: unknown) => fooResponseSchema.parse(raw),
      providesTags: ['Foo'],
    }),
    createFoo: builder.mutation<FooResponse, FooBody>({
      query: (body) => ({
        url: '/foo',
        method: 'POST',
        data: body,
        showSuccessNotification: true,
        showFailureNotification: true,
      }),
      transformResponse: (raw: unknown) => fooResponseSchema.parse(raw),
      invalidatesTags: ['Foo'],
    }),
  }),
});

export const { useGetFoosQuery, useCreateFooMutation } = fooApi;
export default fooApi;
```

Register the API in `src/redux/rootReducer.ts` (reducer) and `src/redux/store.ts` (middleware).

## Bundled rsense skills (when this variant is picked)

The CLI also copies `~/.claude/skills/rsense-*` into the scaffolded project's `.claude/skills/`:

- `rsense-rtk-query-api`
- `rsense-axios-auth`
- `rsense-redux-store-integration`
- `rsense-feature-module`
- `rsense-container-component`
- `rsense-routing-auth-guards`
- `rsense-constants-organization`
- `rsense-utils-pattern`
- `rsense-theming-ui-wrappers`
- `rsense-hoc-layout`

Use `/bfsi-feature MyFeature` (provided by the inlined toolkit) — it'll generate RTK-style scaffolding aligned with these skills.
