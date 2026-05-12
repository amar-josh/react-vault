/**
 * Custom RTK Query baseQuery built on the shared axios instance.
 * Mirrors rsense-react-org's baseQuery: same shape, same notification flags.
 *
 * Each endpoint passes:
 *   { url, method, data, params, headers, showSuccessNotification, showFailureNotification }
 */
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
  async ({
    url,
    method,
    data,
    params,
    headers,
    showSuccessNotification: _showSuccess = false,
    showFailureNotification: _showFailure = false,
    responseType,
  }) => {
    try {
      const requestConfig: AxiosRequestConfig =
        method === GET
          ? { url, method, params: params ?? data, headers }
          : { url, method, data, params, headers };

      if (responseType) {
        requestConfig.responseType = responseType;
      }

      const result: AxiosResponse = await axiosInstance(requestConfig);

      // Wire notification dispatch here once you have the slice:
      // if (showSuccessNotification) {
      //   store.dispatch(setNotification({ type: 'success', message: result.data?.message }));
      // }

      return { data: result.data };
    } catch (axiosError) {
      const error = axiosError as ApiErrorShape;
      // if (showFailureNotification) {
      //   store.dispatch(setNotification({ type: 'error', message: ... }));
      // }
      return {
        error: {
          status: error.response?.status,
          data: error.response?.data?.errors,
        },
      };
    }
  };

export default axiosBaseQuery;
