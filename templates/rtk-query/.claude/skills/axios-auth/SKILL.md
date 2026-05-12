---
name: axios-auth
description: 'Set up Axios instance, request/response interceptors, and custom axiosBaseQuery for RTK Query in Rails-backed React apps. Covers token-based auth with parent/client tokens, automatic auth header injection, 401 handling with auto-logout, success/error notification dispatch, and error response formatting. Use when: axios setup, auth interceptor, token management, API client, base query, 401 handling, notification dispatch.'
---

# Axios & Auth Pattern

## Overview

The API layer uses three files working together:

1. `axiosInstance.ts` - creates the base Axios instance with base URL
2. `interceptor.ts` - adds request/response interceptors for auth & error handling
3. `baseQuery.ts` - wraps Axios as an RTK Query-compatible baseQuery function

## 1. Axios Instance (`src/axiosconfig/axiosInstance.ts`)

```typescript
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export default axiosInstance;
```

- Base URL comes from Vite environment variable
- Single instance shared across all API calls
- No default headers here - interceptors handle auth

## 2. Request Interceptor (Auth Token Injection)

```typescript
// src/axiosconfig/interceptor.ts
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import store from '@/redux/store';
import { setNotification } from '@/shared/Notification/slice';
import axiosInstance from '@/axiosconfig/axiosInstance';
import local from '@/utils/helpers/local';
import { ERROR, LOGGED_IN_USER } from '@/utils/constants/appConstants';
import { ACCESS_LIST, VALIDATE_INVITATION } from '@/utils/constants/urlConstant';

// Type for login state with dual tokens
interface ILoginState {
  parentToken: string | null;
  clientToken: string | null;
}

// Request interceptor - inject auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { parentToken, clientToken }: ILoginState = local.getItem(LOGGED_IN_USER);

    // Parent-level endpoints use parentToken
    if (config?.url === ACCESS_LIST) {
      config.headers.Authorization = parentToken && parentToken;
    } else {
      // Client-level endpoints prefer clientToken, fall back to parentToken
      config.headers.Authorization = clientToken ? clientToken : parentToken;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);
```

### Dual Token System

The app uses two auth tokens for multi-tenant access:

- **parentToken**: Organization admin token (set at login)
- **clientToken**: Specific institutional access token (set when selecting an institution)
- Most endpoints use `clientToken`; org-level endpoints (like access list) use `parentToken`

## 3. Response Interceptor (Error Handling)

```typescript
// Error interface matching Rails API error format
export interface IError {
  config: { url: string };
  response: {
    data: { errors: any; check_destroy?: any };
    status: number;
  };
}

// Response interceptor - handle 401 and errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: IError) => {
    // 401 Unauthorized - auto logout
    if (error?.response?.status === 401) {
      local.clear();
      store.dispatch(
        setNotification({
          type: ERROR,
          message: error?.response?.data?.errors[0]?.detail,
        }),
      );
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);
```

## 4. axiosBaseQuery (RTK Query Integration)

```typescript
// src/axiosconfig/baseQuery.ts
import { AxiosRequestConfig, AxiosResponse, ResponseType } from 'axios';
import { BaseQueryFn } from '@reduxjs/toolkit/query';
import store from '@/redux/store';
import { setNotification } from '@/shared/Notification/slice';
import axiosInstance from '@/axiosconfig/axiosInstance';
import '@/axiosconfig/interceptor'; // Side-effect import to register interceptors
import { ERROR, SUCCESS } from '@/utils/constants/appConstants';
import { GET } from '@/utils/constants/apiConstants';

const axiosBaseQuery =
  (): BaseQueryFn<
    {
      url: string;
      method?: AxiosRequestConfig['method'];
      data?: AxiosRequestConfig['data'];
      params?: AxiosRequestConfig['params'];
      headers?: AxiosRequestConfig['headers'];
      showSuccesNotification?: boolean;
      showFailureNotification?: boolean;
      responseType?: ResponseType;
    },
    unknown,
    unknown
  > =>
  async ({
    url,
    method,
    data,
    showSuccesNotification = false,
    showFailureNotification = false,
    responseType,
  }) => {
    try {
      // GET requests: data goes as query params
      // POST/PUT/DELETE: data goes as request body
      const requestConfig: AxiosRequestConfig =
        method === GET ? { url, method, params: data } : { url, method, data };

      if (responseType) {
        requestConfig.responseType = responseType;
      }

      const result: AxiosResponse = await axiosInstance(requestConfig);
      const responseData = result?.data;

      // Dispatch success notification if flagged
      if (showSuccesNotification) {
        store.dispatch(setNotification({ type: SUCCESS, message: responseData?.message }));
      }

      return { data: responseData };
    } catch (axiosError) {
      const error = axiosError as IError;

      // Dispatch error notification if flagged
      if (showFailureNotification) {
        store.dispatch(
          setNotification({
            type: ERROR,
            message: error?.response?.data?.errors[0]?.detail,
          }),
        );
      }

      return {
        error: {
          status: error.response?.status,
          data: error?.response?.data?.errors,
        },
      };
    }
  };

export default axiosBaseQuery;
```

## Notification Integration

The `setNotification` action dispatches to a shared Notification slice:

```typescript
// src/shared/Notification/slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface INotification {
  type: string; // "success" | "error"
  message: string;
}

const notificationSlice = createSlice({
  name: 'notification',
  initialState: { type: '', message: '' },
  reducers: {
    setNotification: (state, action: PayloadAction<INotification>) => {
      state.type = action.payload.type;
      state.message = action.payload.message;
    },
    clearNotification: (state) => {
      state.type = '';
      state.message = '';
    },
  },
});
```

A shared `<Notification />` component listens to this slice and renders Ant Design notifications.

## localStorage Helper

```typescript
// src/utils/helpers/local.ts
const local = {
  getItem: (key: string) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  setItem: (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: (key: string) => localStorage.removeItem(key),
  clear: () => localStorage.clear(),
};

export default local;
```

## Key Rules

1. Auth tokens are NEVER hardcoded - they come from localStorage via the login flow
2. The interceptor side-effect import in `baseQuery.ts` (`import "@/axiosconfig/interceptor"`) is critical
3. GET requests automatically convert `data` to query `params` in axiosBaseQuery
4. Notification flags (`showSuccesNotification`, `showFailureNotification`) are opt-in per endpoint
5. 401 responses trigger automatic logout (clear storage + redirect to login)
6. Error responses are normalized to `{ status, data: errors }` format for containers to handle
7. The Rails backend returns errors as `{ errors: [{ detail: "message" }] }`
