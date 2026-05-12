import { describe, it, expect } from 'vitest';
import { scrub, hashRequest } from '../src/audit/scrubber.js';

describe('audit scrubber', () => {
  it('scrubs values for sensitive keys regardless of content', () => {
    const result = scrub({ pan: 'safe-looking-string', name: 'John' });
    expect((result as Record<string, unknown>).pan).toBe('<scrubbed>');
    expect((result as Record<string, unknown>).name).toBe('<scrubbed>');
  });

  it('scrubs PAN-shaped values even under non-sensitive keys', () => {
    const result = scrub({ note: 'My PAN is ABCDE1234F', random: 'fine' });
    expect((result as Record<string, unknown>).note).toBe('<scrubbed>');
    expect((result as Record<string, unknown>).random).toBe('fine');
  });

  it('scrubs Aadhaar-shaped 12-digit values', () => {
    const result = scrub({ note: '123456789012' });
    expect((result as Record<string, unknown>).note).toBe('<scrubbed>');
  });

  it('preserves primitive non-PII values', () => {
    const result = scrub({ count: 5, active: true });
    expect(result).toEqual({ count: 5, active: true });
  });

  it('recurses into arrays', () => {
    const result = scrub({ items: [{ pan: 'X' }, { pan: 'Y' }] });
    expect(result).toEqual({ items: [{ pan: '<scrubbed>' }, { pan: '<scrubbed>' }] });
  });

  it('caps recursion depth to prevent pathological inputs', () => {
    interface Nested {
      level: number;
      child?: Nested;
    }
    const deep: Nested = { level: 0 };
    let cursor = deep;
    for (let i = 1; i < 30; i++) {
      const child: Nested = { level: i };
      cursor.child = child;
      cursor = child;
    }
    expect(() => scrub(deep)).not.toThrow();
  });

  it('handles null and undefined cleanly', () => {
    expect(scrub({ pan: null, aadhaar: undefined })).toEqual({ pan: null, aadhaar: undefined });
  });

  it('scrubs API keys by value pattern', () => {
    const result = scrub({ note: 'token is sk-live_abcdef1234567890abcdef' });
    expect((result as Record<string, unknown>).note).toBe('<scrubbed>');
  });

  it('honours additional patterns', () => {
    const result = scrub(
      { note: 'rsense-internal-token-XYZ' },
      { additionalPatterns: [/rsense-internal/] },
    );
    expect((result as Record<string, unknown>).note).toBe('<scrubbed>');
  });
});

describe('hashRequest', () => {
  it('produces a 64-char hex string', async () => {
    const hash = await hashRequest({ a: 1, b: 'two' });
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces same hash for same input', async () => {
    const a = await hashRequest({ a: 1 });
    const b = await hashRequest({ a: 1 });
    expect(a).toBe(b);
  });

  it('produces different hashes for different inputs', async () => {
    const a = await hashRequest({ a: 1 });
    const b = await hashRequest({ a: 2 });
    expect(a).not.toBe(b);
  });
});
