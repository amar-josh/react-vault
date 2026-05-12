/**
 * Single axios instance shared across the app. Auth token is set ONCE at
 * login via setAuthToken() from @your-real-scope/core/http (rsense-style,
 * set-at-login — not injected per-request).
 *
 * Side-effect import of `./interceptor` wires the response interceptor for
 * notifications + 401 handling.
 */
import { createAxios } from '@your-real-scope/core/http';
import { env } from '../env.js';
import './interceptor.js';

const axiosInstance = createAxios({
  baseURL: env.VITE_API_BASE_URL,
  timeoutMs: env.VITE_API_TIMEOUT_MS,
  authHeaderName: env.VITE_AUTH_HEADER_NAME,
  snakeCaseBackend: false, // flip to true if backend uses snake_case
  onUnauthorized: () => {
    // Token already cleared by core; route to login here.
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
});

export default axiosInstance;
