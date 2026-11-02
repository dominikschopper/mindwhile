import { describe, expect, it, vi, afterEach } from 'vitest';
import { encodePlayerId, isPlayerId, newPlayerId } from './player-id';

const alphabetPattern = /^[A-Za-z0-9_-]{11}$/;

describe('encodePlayerId', () => {
  it('encodes zero bytes', () => {
    expect(encodePlayerId(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]))).toBe('AAAAAAAAAAA');
  });

  it('encodes all-ones bytes', () => {
    expect(encodePlayerId(new Uint8Array(8).fill(255))).toBe('__________8');
  });

  it('encodes the bytes 1 to 8 (same as standard base64 "AQIDBAUGBwg=" without padding)', () => {
    expect(encodePlayerId(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toBe('AQIDBAUGBwg');
  });

  it('throws a RangeError for any other length', () => {
    expect(() => encodePlayerId(new Uint8Array(7))).toThrow(RangeError);
    expect(() => encodePlayerId(new Uint8Array(9))).toThrow(RangeError);
    expect(() => encodePlayerId(new Uint8Array(0))).toThrow(RangeError);
  });
});

describe('newPlayerId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('encodes the bytes from crypto.getRandomValues', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: <T extends Uint8Array>(array: T): T => {
        array.set([1, 2, 3, 4, 5, 6, 7, 8]);
        return array;
      },
    });
    expect(newPlayerId()).toBe('AQIDBAUGBwg');
  });

  it('always returns 11 alphabet characters and a valid ID', () => {
    for (let i = 0; i < 2000; i++) {
      const id = newPlayerId();
      expect(id).toMatch(alphabetPattern);
      expect(isPlayerId(id)).toBe(true);
    }
  });

  it('gives unique IDs in 2000 draws', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 2000; i++) ids.add(newPlayerId());
    expect(ids.size).toBe(2000);
  });
});

describe('isPlayerId', () => {
  it('accepts a generated ID', () => {
    expect(isPlayerId(newPlayerId())).toBe(true);
  });

  it('accepts the canonical examples', () => {
    expect(isPlayerId('AAAAAAAAAAA')).toBe(true);
    expect(isPlayerId('__________8')).toBe(true);
  });

  it('rejects a wrong length', () => {
    expect(isPlayerId('AAAAAAAAAA')).toBe(false);
    expect(isPlayerId('AAAAAAAAAAAA')).toBe(false);
    expect(isPlayerId('')).toBe(false);
  });

  it('rejects a character outside the alphabet', () => {
    expect(isPlayerId('AAAAAAAAAA+')).toBe(false);
    expect(isPlayerId('AAAAAAAAA=A')).toBe(false);
    expect(isPlayerId('AAAAAAAAA A')).toBe(false);
  });

  it('rejects a non-canonical last character (low two bits set)', () => {
    // 'B' is index 1, 'D' index 3, '9' index 61 (all carry non-zero low bits)
    expect(isPlayerId('AAAAAAAAAAB')).toBe(false);
    expect(isPlayerId('AAAAAAAAAAD')).toBe(false);
    expect(isPlayerId('AAAAAAAAAA9')).toBe(false);
    expect(isPlayerId('AAAAAAAAAA_')).toBe(false);
    expect(isPlayerId('AAAAAAAAAAE')).toBe(true);
  });

  it('rejects a number, null and undefined', () => {
    expect(isPlayerId(12345678901)).toBe(false);
    expect(isPlayerId(null)).toBe(false);
    expect(isPlayerId(undefined)).toBe(false);
  });
});
