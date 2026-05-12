/**
 * Response interceptor for the shared axios instance. Imported for its side
 * effect from axiosInstance.ts. Pattern mirrors rsense-react-org.
 *
 * - 401: clear local auth state (handled by createAxios's onUnauthorized
 *   callback), dispatch error notification.
 * - Other 4xx/5xx: surface the server message via the notification slice.
 */
import type { AxiosError, AxiosResponse } from 'axios';
import axiosInstance from './axiosInstance.js';
// Wire your notification slice + store here. Placeholders below.
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

    // Hook this up to your notification slice once you wire it.
    // store.dispatch(setNotification({ type: 'error', message: extractMessage(err) }));

    if (status === 401) {
      // 401 is also handled by createAxios's onUnauthorized callback (clears token).
      // Add your own redirect / dispatch here.
    }

    return Promise.reject(err);
  },
);
