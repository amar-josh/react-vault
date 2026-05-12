/**
 * Audit event shape. Matches the backend `POST /api/audit` contract.
 */
export interface AuditEvent {
  /** Client-generated UUID v4. Backend re-stamps if needed for legal record. */
  event_id: string;
  /** Dot-separated convention: <feature>.<entity>.<action> */
  event_name: string;
  /** Who did it. From session. */
  actor_id: string;
  /** Session correlation. */
  actor_session_id?: string;
  /** Type of resource the action targets. */
  target_type?: string;
  /** Resource ID. */
  target_id?: string;
  /** ISO 8601. Client clock; backend re-stamps. */
  timestamp: string;
  /** Outcome of the action. */
  outcome: 'success' | 'failure' | 'pending';
  /** SHA-256 of the request body (for tamper detection). */
  request_hash?: string;
  /** Non-PII context. User agent, viewport, feature flag state, etc. */
  client_metadata?: Record<string, unknown>;
  /** Free-form metadata. Will be scrubbed for PII before send. */
  metadata?: Record<string, unknown>;
}

export interface AuditClientConfig {
  /** Endpoint to POST events to. */
  endpoint: string;
  /** Max events to batch before sending. Default 20. */
  batchSize?: number;
  /** Max ms between flushes regardless of batch size. Default 5000. */
  flushIntervalMs?: number;
  /** Custom fetch (e.g. authenticated fetch). Default `fetch`. */
  fetchImpl?: typeof fetch;
  /** Called on send failure. Useful for surfacing to error monitoring. */
  onError?: (err: unknown, batch: AuditEvent[]) => void;
  /** Additional PII patterns to scrub (beyond defaults). */
  additionalScrubPatterns?: RegExp[];
}
