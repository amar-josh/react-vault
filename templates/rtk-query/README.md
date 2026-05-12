# Template: RTK Query variant

Overlay applied on top of `templates/_shared/` when the user picks **RTK Query**.

## What this overlay adds

- `@reduxjs/toolkit` + `react-redux` dependencies (merged into package.json)
- `src/store/index.ts` — `configureStore` with RTK Query middleware
- `src/api/baseApi.ts` — root API with axios-based baseQuery, error mapping, token injection

## Feature pattern

```ts
// src/features/Foo/api.ts
import { baseApi } from '@/api/baseApi';

export const fooApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFoo: builder.query<FooResponse, FooQuery>({
      query: (arg) => ({ url: '/foo', method: 'GET', params: arg }),
      transformResponse: (raw: unknown) => fooResponseSchema.parse(raw),
      providesTags: ['Foo'],
    }),
    createFoo: builder.mutation<FooResponse, FooBody>({
      query: (body) => ({ url: '/foo', method: 'POST', data: body }),
      transformResponse: (raw: unknown) => fooResponseSchema.parse(raw),
      invalidatesTags: ['Foo'],
    }),
  }),
});

export const { useGetFooQuery, useCreateFooMutation } = fooApi;
```

Scaffold a new feature: `/bfsi-feature MyFeature` (variant auto-detected as RTK).
