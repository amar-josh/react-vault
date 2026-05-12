/**
 * Secure storage abstraction. In-memory by default; sessionStorage on opt-in;
 * encrypted IndexedDB for persistent needs.
 *
 * v0.1: in-memory + sessionStorage tiers implemented. Persistent (encrypted IDB)
 * is stubbed and throws — implement in a follow-up.
 */
import type { Sensitivity, SecureStorageOptions, StorageRecord } from './types.js';

const PREFIX = 'bfsi:';

const memoryStore = new Map<string, StorageRecord<unknown>>();

function nowMs(): number {
  return Date.now();
}

function buildRecord<T>(value: T, ttlMs?: number): StorageRecord<T> {
  const storedAt = nowMs();
  return {
    value,
    storedAt,
    expiresAt: ttlMs ? storedAt + ttlMs : undefined,
  };
}

function isExpired<T>(rec: StorageRecord<T>): boolean {
  return rec.expiresAt !== undefined && rec.expiresAt < nowMs();
}

function memPut<T>(key: string, value: T, ttlMs?: number): void {
  memoryStore.set(key, buildRecord(value, ttlMs));
}

function memGet<T>(key: string): T | null {
  const rec = memoryStore.get(key) as StorageRecord<T> | undefined;
  if (!rec) return null;
  if (isExpired(rec)) {
    memoryStore.delete(key);
    return null;
  }
  return rec.value;
}

function memDel(key: string): void {
  memoryStore.delete(key);
}

function sessionPut<T>(key: string, value: T, ttlMs?: number): void {
  if (typeof sessionStorage === 'undefined') {
    memPut(key, value, ttlMs);
    return;
  }
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(buildRecord(value, ttlMs)));
  } catch {
    // Quota or privacy mode — fall back to memory
    memPut(key, value, ttlMs);
  }
}

function sessionGet<T>(key: string): T | null {
  if (typeof sessionStorage === 'undefined') return memGet(key);
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const rec = JSON.parse(raw) as StorageRecord<T>;
    if (isExpired(rec)) {
      sessionStorage.removeItem(PREFIX + key);
      return null;
    }
    return rec.value;
  } catch {
    return null;
  }
}

function sessionDel(key: string): void {
  if (typeof sessionStorage === 'undefined') {
    memDel(key);
    return;
  }
  sessionStorage.removeItem(PREFIX + key);
}

/**
 * Put a value into secure storage.
 */
export function put<T>(key: string, value: T, opts: SecureStorageOptions = {}): void {
  const sensitivity: Sensitivity = opts.sensitivity ?? 'transient';
  switch (sensitivity) {
    case 'transient':
      memPut(key, value, opts.ttlMs);
      return;
    case 'session':
      sessionPut(key, value, opts.ttlMs);
      return;
    case 'persistent':
      throw new Error(
        'persistent storage requires encrypted-IndexedDB adapter — not implemented in v0.1',
      );
  }
}

/**
 * Get a value. Returns null if absent or expired.
 */
export function get<T>(key: string, opts: { sensitivity?: Sensitivity } = {}): T | null {
  const sensitivity = opts.sensitivity ?? 'transient';
  switch (sensitivity) {
    case 'transient':
      return memGet<T>(key);
    case 'session':
      return sessionGet<T>(key);
    case 'persistent':
      throw new Error(
        'persistent storage requires encrypted-IndexedDB adapter — not implemented in v0.1',
      );
  }
}

export function del(key: string, opts: { sensitivity?: Sensitivity } = {}): void {
  const sensitivity = opts.sensitivity ?? 'transient';
  switch (sensitivity) {
    case 'transient':
      memDel(key);
      return;
    case 'session':
      sessionDel(key);
      return;
    case 'persistent':
      throw new Error(
        'persistent storage requires encrypted-IndexedDB adapter — not implemented in v0.1',
      );
  }
}

/**
 * Clear ALL stored values in the given tier. For logout flows.
 */
export function clearAll(opts: { sensitivity?: Sensitivity } = {}): void {
  const sensitivity = opts.sensitivity ?? 'transient';
  if (sensitivity === 'transient') {
    memoryStore.clear();
    return;
  }
  if (sensitivity === 'session') {
    if (typeof sessionStorage === 'undefined') {
      memoryStore.clear();
      return;
    }
    const toRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(PREFIX)) toRemove.push(k);
    }
    for (const k of toRemove) sessionStorage.removeItem(k);
    return;
  }
  throw new Error('persistent storage requires encrypted-IndexedDB adapter — not implemented in v0.1');
}
