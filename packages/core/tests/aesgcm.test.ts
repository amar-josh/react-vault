/**
 * AES-GCM round-trip + tamper tests. Catches 95% of misuse per the encrypt-helper skill.
 */
import { describe, it, expect } from 'vitest';
import * as aesgcm from '../src/encryption/aesgcm.js';

describe('aesgcm', () => {
  it('produces different ciphertext on each encrypt (IV randomness)', async () => {
    const key = await aesgcm.generateKey();
    const a = await aesgcm.encrypt(key, 'test');
    const b = await aesgcm.encrypt(key, 'test');
    expect(a).not.toBe(b);
  });

  it('round-trips a string', async () => {
    const key = await aesgcm.generateKey();
    const ciphertext = await aesgcm.encrypt(key, 'hello bfsi world');
    expect(await aesgcm.decrypt(key, ciphertext)).toBe('hello bfsi world');
  });

  it('throws on tampered ciphertext', async () => {
    const key = await aesgcm.generateKey();
    const ciphertext = await aesgcm.encrypt(key, 'test');
    // Flip the last few characters (in the auth tag region)
    const tampered = ciphertext.slice(0, -4) + (ciphertext.endsWith('A') ? 'BBBB' : 'AAAA');
    await expect(aesgcm.decrypt(key, tampered)).rejects.toThrow();
  });

  it('round-trips raw byte payloads', async () => {
    const key = await aesgcm.generateKey();
    const original = new Uint8Array([1, 2, 3, 4, 5]);
    const ciphertext = await aesgcm.encryptBytes(key, original);
    const decrypted = await aesgcm.decryptBytes(key, ciphertext);
    expect(Array.from(decrypted)).toEqual([1, 2, 3, 4, 5]);
  });

  it('exports and re-imports a key (interop)', async () => {
    const k1 = await aesgcm.generateKey();
    const raw = await aesgcm.exportRawKey(k1);
    expect(raw.length).toBe(32);
    const k2 = await aesgcm.importRawKey(raw);
    const ciphertext = await aesgcm.encrypt(k1, 'cross-key');
    expect(await aesgcm.decrypt(k2, ciphertext)).toBe('cross-key');
  });

  it('rejects wrong-length raw keys', async () => {
    await expect(aesgcm.importRawKey(new Uint8Array(31))).rejects.toThrow(/32 bytes/);
  });
});
