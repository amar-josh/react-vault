/**
 * Configurable axios factory. Apps create one (or more) instances by
 * composing the interceptors they need.
 */
import axios, { type AxiosInstance } from 'axios';
import {
  attachAuthHeader,
  attachCamelToSnake,
  attachErrorMapping,
  attachRequestIds,
  attachSnakeToCamel,
} from './interceptors.js';

export interface CreateAxiosOptions {
  baseURL: string;
  timeoutMs?: number;
  /** Provide a function that returns the current auth token. */
  getToken?: () => string | null;
  /** Header name for the token. Default `Authorization` (sends `Bearer <token>`). */
  authHeaderName?: string;
  /** Callback for 401 responses (typically: clear auth + redirect to login). */
  onUnauthorized?: () => void;
  /**
   * Whether backend uses snake_case. If true, response keys are converted to
   * camelCase and request bodies converted to snake_case.
   */
  snakeCaseBackend?: boolean;
  /** Disable auto idempotency-key + correlation-id headers if you handle them yourself. */
  disableRequestIds?: boolean;
}

export function createAxios(opts: CreateAxiosOptions): AxiosInstance {
  const instance = axios.create({
    baseURL: opts.baseURL,
    timeout: opts.timeoutMs ?? 30_000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  if (opts.getToken) {
    attachAuthHeader(instance, {
      getToken: opts.getToken,
      headerName: opts.authHeaderName,
    });
  }

  if (!opts.disableRequestIds) {
    attachRequestIds(instance);
  }

  if (opts.snakeCaseBackend) {
    attachSnakeToCamel(instance);
    attachCamelToSnake(instance);
  }

  attachErrorMapping(instance, {
    onUnauthorized: opts.onUnauthorized,
  });

  return instance;
}
