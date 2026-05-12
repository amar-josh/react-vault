/**
 * Plain axios client (not RTK Query). TanStack Query hooks call this via
 * createQuery / createMutation factories.
 */
import { createAxios } from '@your-real-scope/core/http';
import { env } from '../env.js';

export const http = createAxios({
  baseURL: env.VITE_API_BASE_URL,
  timeoutMs: env.VITE_API_TIMEOUT_MS,
  getToken: () => null, // TODO: read from auth store
  authHeaderName: env.VITE_AUTH_HEADER_NAME,
  onUnauthorized: () => {
    // TODO: clear auth + redirect to login
  },
  snakeCaseBackend: false,
});
