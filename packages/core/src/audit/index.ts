/**
 * Audit logging — batched, PII-scrubbed audit events for BFSI compliance.
 *
 * Required for RBI Annexure I §8, SOC2 CC7.3, PCI-DSS req 10.
 */
export * from './auditClient.js';
export * from './scrubber.js';
export * from './types.js';
