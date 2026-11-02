/**
 * Small key-value interface over `localStorage`. Values are plain strings,
 * JSON is handled by the callers.
 *
 * If the backend is missing, unusable or a call fails (for example a quota
 * error), the affected key falls back to memory for the rest of the session.
 * Nothing is shown to the user and nothing is logged.
 */
export interface KeyValueStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

type BackendStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function defaultBackend(): BackendStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Creates a storage on top of `backend`. Without an argument the backend is
 * `globalThis.localStorage`. Pass `null` to work purely in memory.
 */
export function createStorage(backend?: BackendStorage | null): KeyValueStorage {
  const target = backend === undefined ? defaultBackend() : backend;

  // Keys that switched to memory. A `null` value means the key was removed
  // (or has no readable value) in memory.
  const memory = new Map<string, string | null>();

  return {
    get(key) {
      if (memory.has(key)) {
        return memory.get(key) ?? null;
      }
      if (target === null) {
        memory.set(key, null);
        return null;
      }
      try {
        return target.getItem(key);
      } catch {
        memory.set(key, null);
        return null;
      }
    },

    set(key, value) {
      if (!memory.has(key) && target !== null) {
        try {
          target.setItem(key, value);
          return;
        } catch {
          // Fall through to memory (quota, blocked storage, ...).
        }
      }
      memory.set(key, value);
    },

    remove(key) {
      if (!memory.has(key) && target !== null) {
        try {
          target.removeItem(key);
          return;
        } catch {
          // Fall through to memory.
        }
      }
      memory.set(key, null);
    },
  };
}
