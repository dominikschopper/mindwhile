/**
 * Player ID: 64 random bits, written as 11 characters in base64url without padding.
 * The last character carries only 4 bits, so its last 2 bits are zero (canonical form).
 */

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const byteLength = 8;
const idLength = 11;

/** Returns a fresh player ID from the platform CSPRNG. */
export function newPlayerId(): string {
  return encodePlayerId(crypto.getRandomValues(new Uint8Array(byteLength)));
}

/** Encodes exactly 8 bytes as 11 base64url characters. Throws a RangeError for any other length. */
export function encodePlayerId(bytes: Uint8Array): string {
  if (bytes.length !== byteLength) {
    throw new RangeError(`A player ID needs ${byteLength} bytes, got ${bytes.length}`);
  }
  let out = '';
  let buffer = 0;
  let pending = 0;
  for (const byte of bytes) {
    buffer = ((buffer << 8) | byte) & 0xffff;
    pending += 8;
    while (pending >= 6) {
      pending -= 6;
      out += alphabet.charAt((buffer >> pending) & 63);
    }
  }
  // 64 bits give ten full groups and 4 bits left, padded with 2 zero bits.
  out += alphabet.charAt((buffer << (6 - pending)) & 63);
  return out;
}

/** True only for a canonical player ID: 11 base64url characters, last character with zero low bits. */
export function isPlayerId(value: unknown): value is string {
  if (typeof value !== 'string' || value.length !== idLength) return false;
  for (let i = 0; i < idLength; i++) {
    if (alphabet.indexOf(value.charAt(i)) < 0) return false;
  }
  const last = alphabet.indexOf(value.charAt(idLength - 1));
  return last % 4 === 0;
}
