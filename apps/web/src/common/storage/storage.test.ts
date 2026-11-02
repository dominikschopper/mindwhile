import { describe, expect, it } from 'vitest';
import { createStorage } from './storage';

interface FakeBackendOptions {
  getThrows?: boolean;
  setThrows?: boolean;
  removeThrows?: boolean;
}

/** A minimal `Storage` stand-in with switchable failures. */
function createFakeBackend(options: FakeBackendOptions = {}) {
  const data = new Map<string, string>();
  const backend = {
    getItem(key: string): string | null {
      if (options.getThrows) throw new Error('getItem blocked');
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      if (options.setThrows) throw new DOMException('quota', 'QuotaExceededError');
      data.set(key, value);
    },
    removeItem(key: string): void {
      if (options.removeThrows) throw new Error('removeItem blocked');
      data.delete(key);
    },
  };
  return { backend: backend as unknown as Storage, data };
}

describe('createStorage with a working backend', () => {
  it('sets, gets and removes a value', () => {
    const { backend, data } = createFakeBackend();
    const storage = createStorage(backend);

    storage.set('profile', '{"a":1}');
    expect(storage.get('profile')).toBe('{"a":1}');
    expect(data.get('profile')).toBe('{"a":1}');

    storage.remove('profile');
    expect(storage.get('profile')).toBeNull();
    expect(data.has('profile')).toBe(false);
  });

  it('returns null for a missing key', () => {
    const storage = createStorage(createFakeBackend().backend);
    expect(storage.get('missing')).toBeNull();
  });
});

describe('createStorage without a backend', () => {
  it('works in memory when the backend is null', () => {
    const storage = createStorage(null);

    expect(storage.get('key')).toBeNull();
    storage.set('key', 'value');
    expect(storage.get('key')).toBe('value');
    storage.remove('key');
    expect(storage.get('key')).toBeNull();
  });
});

describe('createStorage failure handling', () => {
  it('returns the in-memory value when getItem throws', () => {
    const storage = createStorage(createFakeBackend({ getThrows: true }).backend);

    expect(storage.get('key')).toBeNull();
    storage.set('key', 'value');
    expect(storage.get('key')).toBe('value');
  });

  it('keeps a value readable when setItem throws (quota)', () => {
    const { backend, data } = createFakeBackend({ setThrows: true });
    const storage = createStorage(backend);

    storage.set('key', 'big value');
    expect(storage.get('key')).toBe('big value');
    expect(data.has('key')).toBe(false);
  });

  it('removes the value for the caller when removeItem throws', () => {
    const { backend, data } = createFakeBackend({ removeThrows: true });
    const storage = createStorage(backend);

    storage.set('key', 'value');
    expect(storage.get('key')).toBe('value');
    storage.remove('key');
    expect(storage.get('key')).toBeNull();
    expect(data.get('key')).toBe('value');
  });

  it('isolates a failing key from other keys', () => {
    const { backend, data } = createFakeBackend({ setThrows: true });
    const storage = createStorage(backend);

    storage.set('failing', 'memory value');
    storage.set('other', 'ok');

    expect(storage.get('failing')).toBe('memory value');
    expect(storage.get('other')).toBe('ok');
    expect(data.get('other')).toBeUndefined();
  });

  it('keeps a key in memory after a failure, even if the backend recovers', () => {
    const { backend, data } = createFakeBackend({ setThrows: true });
    const storage = createStorage(backend);
    storage.set('key', 'first');

    // Backend works again for other keys, but the failed key stays in memory.
    storage.set('key', 'second');
    expect(storage.get('key')).toBe('second');
    expect(data.has('key')).toBe(false);
  });
});
