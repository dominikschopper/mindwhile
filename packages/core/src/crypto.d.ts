// Minimal ambient declaration for the Web Crypto random source.
// `core` has no DOM lib and no node types, so only the one member used here is declared.
declare const crypto: {
  getRandomValues<T extends Uint8Array | Uint32Array>(array: T): T
}
