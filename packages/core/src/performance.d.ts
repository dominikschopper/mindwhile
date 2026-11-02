// Minimal ambient declaration for the monotonic clock used by the active clock.
// `core` has no DOM lib and no node types, so only the one member used here is declared.
declare const performance: {
  now(): number;
};
