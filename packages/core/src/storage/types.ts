export type Sensitivity = 'transient' | 'session' | 'persistent';

export interface SecureStorageOptions {
  /** Storage tier. Default `transient`. */
  sensitivity?: Sensitivity;
  /** Optional TTL in ms — value evicts after this duration. */
  ttlMs?: number;
}

export interface StorageRecord<T> {
  value: T;
  storedAt: number;
  expiresAt?: number;
}
