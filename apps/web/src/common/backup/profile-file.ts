import { parseProfile, serializeProfile } from '@mindwhile/core';
import type { ParseResult, ProfileData } from '@mindwhile/core';

/** Largest accepted file size (compressed). */
export const MAX_FILE_BYTES = 256 * 1024;
/** Largest accepted size after decompression. */
export const MAX_DECOMPRESSED_BYTES = 2 * 1024 * 1024;

export type DecodeResult = ParseResult | { ok: false; reason: 'too-large' | 'unreadable' };

export function isBackupSupported(): boolean {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** `mindwhile-profile-YYYY-MM-DD.json.gz` in local time. */
export function profileFileName(now: Date): string {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `mindwhile-profile-${date}.json.gz`;
}

export async function encodeProfileFile(data: ProfileData): Promise<Blob> {
  const json = JSON.stringify(serializeProfile(data));
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
  const compressed = await new Response(stream).blob();
  return new Blob([compressed], { type: 'application/gzip' });
}

type Gunzipped =
  { ok: true; bytes: Uint8Array } | { ok: false; reason: 'too-large' | 'unreadable' };

async function gunzip(file: Blob): Promise<Gunzipped> {
  const reader = file.stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      total += value.byteLength;
      if (total > MAX_DECOMPRESSED_BYTES) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, reason: 'too-large' };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: 'unreadable' };
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
}

export async function decodeProfileFile(file: Blob): Promise<DecodeResult> {
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, reason: 'too-large' };
  }
  const unzipped = await gunzip(file);
  if (!unzipped.ok) {
    return unzipped;
  }
  let input: unknown;
  try {
    input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(unzipped.bytes));
  } catch {
    return { ok: false, reason: 'unreadable' };
  }
  return parseProfile(input);
}
