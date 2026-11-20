import { describe, expect, it, vi } from 'vitest';
import { serializeProfile } from '@mindwhile/core';
import type { ProfileData, StoredResult } from '@mindwhile/core';
import {
  MAX_DECOMPRESSED_BYTES,
  MAX_FILE_BYTES,
  decodeProfileFile,
  encodeProfileFile,
  isBackupSupported,
  profileFileName,
} from './profile-file';

function entry(i: number): StoredResult {
  return {
    gameId: 'spill-it',
    gameVersion: 1,
    level: `l${i}`,
    seed: i,
    scoreValues: [100],
    scoringVersion: 1,
  };
}

function data(count = 2): ProfileData {
  return {
    profile: { playerId: 'AAAAAAAAAAA', gamerTag: 'Ada', gamerSymbol: 'fox', gamerTagChangedAt: 5 },
    best: Array.from({ length: count }, (_, i) => entry(i)),
  };
}

async function gzip(bytes: Uint8Array | string): Promise<Blob> {
  const source = new Blob([bytes as BlobPart]).stream();
  return new Response(source.pipeThrough(new CompressionStream('gzip'))).blob();
}

async function gzipJson(value: unknown): Promise<Blob> {
  return gzip(JSON.stringify(value));
}

describe('profile file', () => {
  it('reports support', () => {
    expect(isBackupSupported()).toBe(true);
  });

  it('names the file with zero padded local date', () => {
    expect(profileFileName(new Date(2026, 2, 4, 23, 59))).toBe(
      'mindwhile-profile-2026-03-04.json.gz',
    );
  });

  it('round trips', async () => {
    const blob = await encodeProfileFile(data());
    expect(blob.type).toBe('application/gzip');
    const result = await decodeProfileFile(blob);
    expect(result).toEqual({ ok: true, data: data(), skipped: 0 });
  });

  it('rejects an oversize blob without decompressing', async () => {
    const spy = vi.spyOn(globalThis, 'DecompressionStream');
    const result = await decodeProfileFile(new Blob([new Uint8Array(MAX_FILE_BYTES + 1)]));
    expect(result).toEqual({ ok: false, reason: 'too-large' });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('aborts a gzip bomb at the output limit', async () => {
    const bomb = await gzip(new Uint8Array(200 * 1024 * 1024));
    expect(bomb.size).toBeLessThan(MAX_FILE_BYTES);
    const started = Date.now();
    const result = await decodeProfileFile(bomb);
    expect(result).toEqual({ ok: false, reason: 'too-large' });
    expect(Date.now() - started).toBeLessThan(2000);
    expect(MAX_DECOMPRESSED_BYTES).toBe(2 * 1024 * 1024);
  });

  it('accepts 2000 entries and rejects 2001', async () => {
    const ok = await decodeProfileFile(await encodeProfileFile(data(2000)));
    expect(ok.ok && ok.data.best.length).toBe(2000);
    const tooMany = await decodeProfileFile(await encodeProfileFile(data(2001)));
    expect(tooMany).toEqual({ ok: false, reason: 'too-many-results' });
  });

  it('treats random bytes as unreadable', async () => {
    const bytes = new Uint8Array(1000).map((_, i) => (i * 37 + 11) % 256);
    expect(await decodeProfileFile(new Blob([bytes]))).toEqual({ ok: false, reason: 'unreadable' });
  });

  it('treats gzip of non-JSON as unreadable', async () => {
    expect(await decodeProfileFile(await gzip('not json {'))).toEqual({
      ok: false,
      reason: 'unreadable',
    });
  });

  it('treats invalid UTF-8 as unreadable', async () => {
    const blob = await gzip(new Uint8Array([0x7b, 0xff, 0xfe, 0x7d]));
    expect(await decodeProfileFile(blob)).toEqual({ ok: false, reason: 'unreadable' });
  });

  it('passes parse failures through', async () => {
    const envelope = serializeProfile(data());
    expect(await decodeProfileFile(await gzipJson({ ...envelope, app: 'other' }))).toEqual({
      ok: false,
      reason: 'foreign-app',
    });
    expect(await decodeProfileFile(await gzipJson({ ...envelope, fmtv: 99 }))).toEqual({
      ok: false,
      reason: 'newer-version',
    });
  });

  it('reports skipped invalid entries', async () => {
    const envelope = serializeProfile(data());
    const blob = await gzipJson({ ...envelope, best: [...envelope.best, { game: 1 }] });
    const result = await decodeProfileFile(blob);
    expect(result.ok && result.skipped).toBe(1);
    expect(result.ok && result.data.best.length).toBe(2);
  });
});
