/**
 * @your-real-scope/core — barrel export.
 *
 * Prefer importing from sub-paths for tree-shaking:
 *   import { aesgcm } from '@your-real-scope/core/encryption';
 *   import { maskPan } from '@your-real-scope/core/pii';
 *
 * Only re-exports for convenience.
 */
export * as encryption from './encryption/index.js';
export * as pii from './pii/index.js';
export * as audit from './audit/index.js';
export * as http from './http/index.js';
export * as auth from './auth/index.js';
export * as storage from './storage/index.js';
export * as compliance from './compliance/index.js';
