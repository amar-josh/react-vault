/**
 * PII scrubber for audit log payloads.
 *
 * Walks an object recursively, replacing values that look like PII with
 * sentinel tokens. Preserves shape so debugging is still possible.
 *
 * RULES OF SCRUBBING:
 *   - Default to over-redaction; humans can recover from "too little info"
 *     more cheaply than from "leaked PAN in audit log".
 *   - Key-name signal trumps value pattern. `pan: "FOO"` is scrubbed even if
 *     the value doesn't match PAN shape.
 *   - Values matching strong patterns (PAN, Aadhaar) are scrubbed regardless
 *     of key name.
 */

const SENSITIVE_KEY_PATTERNS = [
  /^pan$/i,
  /^aadhaar$/i,
  /^aadhar$/i,
  /^account(_?number)?$/i,
  /^card(_?number)?$/i,
  /^cvv|cvc$/i,
  /^otp$/i,
  /^password|passwd$/i,
  /^secret$/i,
  /^token$/i,
  /^api(_?key)?$/i,
  /^mobile|phone$/i,
  /^email$/i,
  /^dob$|date_of_birth/i,
  /^first_?name|last_?name|full_?name$/i,
  /^address$/i,
  /^ifsc$/i,
  /^upi(_?(id|vpa))?$/i,
  /^passport$/i,
  /^auth/i,
];

const VALUE_PATTERNS = [
  /[A-Z]{5}\d{4}[A-Z]/, // PAN
  /\b\d{12}\b/, // Aadhaar
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/, // AWS access key
  /sk-(live|test)_[A-Za-z0-9]{20,}/, // Stripe
  /sk-ant-[A-Za-z0-9_-]{32,}/, // Anthropic
  /ghp_[A-Za-z0-9]{36}/, // GitHub
  /AIza[0-9A-Za-z_-]{35}/, // Google
];

const REDACTED = '<scrubbed>';

export interface ScrubOptions {
  /** Extra patterns to scrub. */
  additionalPatterns?: RegExp[];
  /** Maximum depth to recurse. Prevents pathological inputs. Default 10. */
  maxDepth?: number;
}

export function scrub(value: unknown, opts: ScrubOptions = {}): unknown {
  const maxDepth = opts.maxDepth ?? 10;
  const extraPatterns = opts.additionalPatterns ?? [];
  return walk(value, 0, maxDepth, extraPatterns);
}

function walk(value: unknown, depth: number, maxDepth: number, extra: RegExp[]): unknown {
  if (depth > maxDepth) return REDACTED;
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return scrubString(value, extra);
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => walk(v, depth + 1, maxDepth, extra));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (isSensitiveKey(k)) {
        out[k] = v === null || v === undefined ? v : REDACTED;
      } else {
        out[k] = walk(v, depth + 1, maxDepth, extra);
      }
    }
    return out;
  }
  return REDACTED;
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((p) => p.test(key));
}

function scrubString(value: string, extra: RegExp[]): string {
  for (const p of VALUE_PATTERNS) {
    if (p.test(value)) return REDACTED;
  }
  for (const p of extra) {
    if (p.test(value)) return REDACTED;
  }
  return value;
}

/**
 * Hash a value with SHA-256 for tamper-detection metadata.
 * Returns hex. Use for `request_hash` — does NOT reverse the input.
 */
export async function hashRequest(input: unknown): Promise<string> {
  const json = JSON.stringify(input);
  const bytes = new TextEncoder().encode(json);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(digest)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
