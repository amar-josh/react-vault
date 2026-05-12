/**
 * baseApi — RTK Query root API with axios baseQuery.
 *
 * Feature APIs inject endpoints into this base via `baseApi.injectEndpoints`.
 */
import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig, AxiosError } from 'axios';
import { createAxios, type ApiError } from '@scope/core/http';
import { env } from '../env.js';

const axios = createAxios({
  baseURL: env.VITE_API_BASE_URL,
  timeoutMs: env.VITE_API_TIMEOUT_MS,
  // Wire to your token store
  getToken: () => null, // TODO: read from auth state
  authHeaderName: env.VITE_AUTH_HEADER_NAME,
  onUnauthorized: () => {
    // TODO: clear auth + redirect to login
  },
  snakeCaseBackend: false, // flip to `true` if backend uses snake_case
});

const axiosBaseQuery =
  (): BaseQueryFn<
    AxiosRequestConfig,
    unknown,
    { status?: number; data?: unknown; message: string }
  > =>
  async (args) => {
    try {
      const result = await axios(args);
      return { data: result.data };
    } catch (e) {
      const err = e as AxiosError | ApiError;
      const message = err.message;
      const status = (err as AxiosError).response?.status;
      const data = (err as AxiosError).response?.data;
      return {
        error: { status, data, message },
      };
    }
  };

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: [],
  endpoints: () => ({}),
});
