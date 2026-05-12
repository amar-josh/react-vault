/**
 * Tiered, policy-driven storage. Defaults to memory-only.
 *
 * Sensitivity levels:
 *   - `transient`  — memory only, cleared on tab close
 *   - `session`    — sessionStorage (per-tab, cleared on close)
 *   - `persistent` — encrypted IndexedDB (survives close)
 *
 * Never use raw localStorage. The BFSI principle: PII never sits in
 * a place readable by `document.cookie` or `localStorage.getItem`.
 */
export * from './secureStorage.js';
export * from './types.js';
