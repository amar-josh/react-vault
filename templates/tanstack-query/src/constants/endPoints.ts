/**
 * API endpoint constants. Grouped by feature/service with a frozen object
 * each — never inline URL strings in service code.
 *
 * Pattern (mirrors stp-portal):
 *
 *   1. Prefix base path per service module (one line per gateway/microservice).
 *   2. Object.freeze() the exported map so accidental mutation throws.
 *   3. Use `as const` only where literal types matter for downstream typing.
 *   4. Dynamic paths use functions: `DETAIL: (id: string) => \`${BASE}/${id}\``.
 *
 * Add a new endpoint:
 *   - Same feature: add a key to the existing frozen object.
 *   - New feature: declare a new `const API_BASE_<FEATURE>` and a new
 *     `export const <FEATURE>_ENDPOINTS = Object.freeze({...})`.
 */

const API_BASE_AUTH = '/auth/api/v1';
const API_BASE_USERS = '/users/api/v1';

export const ENDPOINTS = Object.freeze({
  LOGIN: `${API_BASE_AUTH}/login`,
  LOGOUT: `${API_BASE_AUTH}/logout`,
  REFRESH_TOKEN: `${API_BASE_AUTH}/refresh`,
  ME: `${API_BASE_AUTH}/me`,
});

export const USER_ENDPOINTS = Object.freeze({
  LIST: `${API_BASE_USERS}/list`,
  DETAIL: (id: string) => `${API_BASE_USERS}/${id}`,
  CREATE: `${API_BASE_USERS}/create`,
  UPDATE: (id: string) => `${API_BASE_USERS}/${id}/update`,
  DELETE: (id: string) => `${API_BASE_USERS}/${id}/delete`,
});
