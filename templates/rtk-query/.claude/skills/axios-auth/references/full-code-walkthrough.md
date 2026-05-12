# Axios + Auth — full code walkthrough

Annotated tour of the three files the scaffolder lays down.

## `src/axiosconfig/axiosInstance.ts`

```ts
import { createAxios } from '@<scope>/core/http';
import { env } from '../env.js';
import './interceptor.js'; // side-effect: registers response interceptor

const axiosInstance = createAxios({
  baseURL: env.VITE_API_BASE_URL,
  timeoutMs: env.VITE_API_TIMEOUT_MS,
  authHeaderName: env.VITE_AUTH_HEADER_NAME, // default 'Authorization'
  snakeCaseBackend: false, // flip true for Rails/Python
  onUnauthorized: () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
});

export default axiosInstance;
```

Key points:

- `createAxios` (from core) attaches the BFSI-grade interceptors: request-IDs, idempotency keys, error mapping to typed `ApiError`.
- The `onUnauthorized` callback fires AFTER `clearAuthToken` has already wiped the token off the instance.
- The side-effect `import './interceptor.js'` is critical — it registers the response interceptor when `axiosInstance` is first imported.
- `snakeCaseBackend: true` enables automatic snake↔camel transformation on bodies and responses.

## `src/axiosconfig/interceptor.ts`

```ts
import type { AxiosError, AxiosResponse } from 'axios';
import axiosInstance from './axiosInstance.js';
// import store from '../redux/store.js';
// import { setNotification } from '../shared/Notification/slice.js';

export interface ApiErrorShape {
  config?: { url?: string };
  response?: {
    status?: number;
    data?: {
      errors?: Array<{ detail?: string; details?: string }> | Record<string, string[]>;
      message?: string;
    };
  };
}

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const err = error as unknown as ApiErrorShape;
    const status = err.response?.status;

    // Wire to your Notification slice when ready:
    // store.dispatch(setNotification({ type: 'error', message: extractMessage(err) }));

    if (status === 401) {
      // createAxios's onUnauthorized has already fired (cleared token + navigated).
      // Add any additional auth-cleanup here.
    }

    return Promise.reject(err);
  },
);
```

Notes:

- This file ONLY adds the response side. Request-side concerns (auth header, X-Request-Id, Idempotency-Key) are owned by `createAxios`'s built-in interceptors.
- 401 is double-handled: once in `createAxios` (clears token) and once here (extra cleanup if needed).
- The notification dispatch is commented-out scaffolding; wire it when you create the Notification slice.

## `src/axiosconfig/baseQuery.ts`

```ts
import type { AxiosRequestConfig, AxiosResponse, ResponseType } from 'axios';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import axiosInstance from './axiosInstance.js';
import type { ApiErrorShape } from './interceptor.js';

const GET = 'GET' as const;

const axiosBaseQuery =
  (): BaseQueryFn<
    {
      url: string;
      method?: AxiosRequestConfig['method'];
      data?: AxiosRequestConfig['data'];
      params?: AxiosRequestConfig['params'];
      headers?: AxiosRequestConfig['headers'];
      showSuccessNotification?: boolean;
      showFailureNotification?: boolean;
      responseType?: ResponseType;
    },
    unknown,
    unknown
  > =>
  async ({ url, method, data, params, headers, responseType }) => {
    try {
      const requestConfig: AxiosRequestConfig =
        method === GET
          ? { url, method, params: params ?? data, headers }
          : { url, method, data, params, headers };

      if (responseType) requestConfig.responseType = responseType;

      const result: AxiosResponse = await axiosInstance(requestConfig);
      return { data: result.data };
    } catch (axiosError) {
      const error = axiosError as ApiErrorShape;
      return {
        error: {
          status: error.response?.status,
          data: error.response?.data?.errors,
        },
      };
    }
  };

export default axiosBaseQuery;
```

Notes:

- Endpoints pass `data` for both GET and non-GET — `axiosBaseQuery` routes it correctly (`params` for GET, `data` for others).
- `showSuccessNotification` / `showFailureNotification` are flags that get inspected here. Wiring goes to the Notification slice once that's set up.
- Returns the RTK Query `{ data }` / `{ error }` shape. Error.data is the raw `errors` payload — features format it for display.

## Order of imports matters

```
axiosInstance.ts ─── imports → interceptor.ts (side-effect)
       │
       ▼ (default export)
baseQuery.ts ─── imports → axiosInstance (same singleton)
       │
       ▼ (default export)
features/<X>/api.ts ─── createApi({ baseQuery: axiosBaseQuery() })
```

Anyone calling `axiosInstance` (directly or via baseQuery) gets a fully-interceptor-wired instance because of the side-effect import chain.
