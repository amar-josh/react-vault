/**
 * Audit client. Buffers events and POSTs them in batches.
 *
 * Survival rules:
 *   - On failure, retry once with exponential backoff
 *   - On second failure, store in sessionStorage and retry next flush
 *   - On page unload, flush via sendBeacon (best-effort)
 */
import type { AuditEvent, AuditClientConfig } from './types.js';
import { scrub } from './scrubber.js';

const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_FLUSH_MS = 5_000;
const STORAGE_KEY = '__bfsi_audit_pending__';

export class AuditClient {
  private queue: AuditEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inflight = false;

  constructor(private readonly config: AuditClientConfig) {
    this.restoreFromStorage();
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => this.flushBeacon());
      window.addEventListener('beforeunload', () => this.flushBeacon());
    }
  }

  /**
   * Record an event. Scrubs metadata for PII before queueing.
   */
  record(event: AuditEvent): void {
    const scrubbed: AuditEvent = {
      ...event,
      metadata: event.metadata
        ? (scrub(event.metadata, { additionalPatterns: this.config.additionalScrubPatterns }) as Record<
            string,
            unknown
          >)
        : undefined,
    };
    this.queue.push(scrubbed);

    const batchSize = this.config.batchSize ?? DEFAULT_BATCH_SIZE;
    if (this.queue.length >= batchSize) {
      void this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  /**
   * Force-flush the queue. Returns when done.
   */
  async flush(): Promise<void> {
    if (this.inflight || this.queue.length === 0) return;
    this.inflight = true;
    this.clearTimer();

    const batch = this.queue.splice(0);
    try {
      await this.send(batch);
    } catch (err) {
      // Re-queue on failure
      this.queue.unshift(...batch);
      this.persistToStorage();
      try {
        this.config.onError?.(err, batch);
      } catch {
        // swallow — onError must not throw further
      }
    } finally {
      this.inflight = false;
    }
  }

  private scheduleFlush(): void {
    if (this.timer) return;
    const intervalMs = this.config.flushIntervalMs ?? DEFAULT_FLUSH_MS;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, intervalMs);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private async send(batch: AuditEvent[]): Promise<void> {
    const fetcher = this.config.fetchImpl ?? fetch;
    const response = await fetcher(this.config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
    });
    if (!response.ok) {
      throw new Error(`audit endpoint returned ${response.status}`);
    }
    this.persistToStorage();
  }

  private flushBeacon(): void {
    if (this.queue.length === 0) return;
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
      this.persistToStorage();
      return;
    }
    const blob = new Blob([JSON.stringify({ events: this.queue })], {
      type: 'application/json',
    });
    const sent = navigator.sendBeacon(this.config.endpoint, blob);
    if (sent) {
      this.queue = [];
      this.persistToStorage();
    }
  }

  private persistToStorage(): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      if (this.queue.length === 0) {
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
      }
    } catch {
      // sessionStorage may be unavailable (privacy mode); fail silent
    }
  }

  private restoreFromStorage(): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuditEvent[];
        if (Array.isArray(parsed)) {
          this.queue.unshift(...parsed);
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // ignore corrupt state
    }
  }
}

/**
 * Generate a UUID v4. Used for event_id.
 */
export function generateEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: not as strong, but works in environments without randomUUID
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Convenience: generate a short error reference code shown to users in toasts.
 * E.g. `ERR-A7K2`. Use to correlate UI error to full log entry.
 */
export function generateErrorRef(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // no 0/O confusion
  let out = 'ERR-';
  const bytes = new Uint8Array(4);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 4; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < 4; i++) out += chars[bytes[i]! % chars.length];
  return out;
}
