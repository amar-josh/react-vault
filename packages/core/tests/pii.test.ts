import { describe, it, expect } from 'vitest';
import {
  maskPan,
  maskAadhaar,
  maskAccountNumber,
  maskCardLast4,
  maskMobile,
  maskEmail,
  maskName,
  isValidPan,
  isValidAadhaar,
  aadhaarVerhoeff,
  isValidIndianMobile,
  isValidIfsc,
} from '../src/pii/index.js';

describe('maskers', () => {
  it('masks PAN preserving first 5 + last char', () => {
    expect(maskPan('ABCDE1234F')).toBe('ABCDE****F');
  });
  it('returns empty for null PAN', () => {
    expect(maskPan(null)).toBe('');
    expect(maskPan(undefined)).toBe('');
  });
  it('returns input unchanged for non-PAN-shaped value', () => {
    expect(maskPan('XYZ')).toBe('XYZ');
  });
  it('masks Aadhaar showing last 4', () => {
    expect(maskAadhaar('123456789012')).toBe('XXXX XXXX 9012');
  });
  it('masks account number showing last 4', () => {
    expect(maskAccountNumber('123456789012345')).toBe('***********2345');
  });
  it('masks card with PCI-friendly format', () => {
    expect(maskCardLast4('4111111111111234')).toBe('**** **** **** 1234');
  });
  it('masks Indian mobile keeping last 4', () => {
    expect(maskMobile('9876543210')).toBe('+91 ******3210');
  });
  it('masks email preserving first char + domain', () => {
    expect(maskEmail('john.doe@example.com')).toBe('j***@example.com');
  });
  it('masks single-char email local part', () => {
    expect(maskEmail('a@b.com')).toBe('*@b.com');
  });
  it('masks name to initials', () => {
    expect(maskName('John Smith Doe')).toBe('J. S. D.');
  });
});

describe('validators', () => {
  it('PAN: valid shape', () => {
    expect(isValidPan('ABCDE1234F')).toBe(true);
  });
  it('PAN: rejects lowercase', () => {
    expect(isValidPan('abcde1234f')).toBe(false);
  });
  it('PAN: rejects wrong length', () => {
    expect(isValidPan('ABCDE12345')).toBe(false);
  });
  it('IFSC: accepts valid format', () => {
    expect(isValidIfsc('HDFC0CITITC')).toBe(true);
  });
  it('IFSC: rejects lowercase', () => {
    expect(isValidIfsc('hdfc0cititc')).toBe(false);
  });
  it('mobile: accepts numbers starting 6-9', () => {
    expect(isValidIndianMobile('9876543210')).toBe(true);
    expect(isValidIndianMobile('6876543210')).toBe(true);
  });
  it('mobile: rejects numbers starting 1-5', () => {
    expect(isValidIndianMobile('5876543210')).toBe(false);
  });
});

describe('aadhaar verhoeff', () => {
  it('rejects an Aadhaar with wrong checksum', () => {
    // 123456789012 has wrong Verhoeff checksum
    expect(isValidAadhaar('123456789012')).toBe(false);
  });
  it('Verhoeff function operates without throwing', () => {
    expect(() => aadhaarVerhoeff('123456789012')).not.toThrow();
  });
});
