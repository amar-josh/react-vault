/**
 * CSP (Content Security Policy) helpers.
 * Generates per-request nonces for inline scripts/styles where unavoidable.
 */
import { toBase64, randomBytes } from '../encryption/util.js';

/**
 * Generate a fresh nonce. Use once per page load, embed in CSP header AND
 * `<script nonce="...">`, `<style nonce="...">`.
 */
export function generateCspNonce(): string {
  return toBase64(randomBytes(16));
}

/**
 * Build a recommended baseline CSP header value for BFSI apps.
 * The caller can tighten further per their backend / CDN.
 */
export interface CspOptions {
  nonce: string;
  /** Allowed API origins, e.g. ['https://api.example.com']. */
  connectSrc?: string[];
  /** Allowed image origins. Default 'self' + 'data:'. */
  imgSrc?: string[];
  /** Where to send violation reports. */
  reportUri?: string;
}

export function buildCsp(opts: CspOptions): string {
  const connectSrc = ["'self'", ...(opts.connectSrc ?? [])].join(' ');
  const imgSrc = ["'self'", "data:", ...(opts.imgSrc ?? [])].join(' ');
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${opts.nonce}'`,
    `style-src 'self' 'nonce-${opts.nonce}'`,
    `img-src ${imgSrc}`,
    `font-src 'self' data:`,
    `connect-src ${connectSrc}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ];
  if (opts.reportUri) {
    directives.push(`report-uri ${opts.reportUri}`);
  }
  return directives.join('; ');
}
