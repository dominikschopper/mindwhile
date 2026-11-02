import { migrate, migrationSteps } from './migrations';
import type { MigrationStep } from './migrations';
import { isPlayerId } from './player-id';
import { APP_ID, profileKind, profileFromWire, storedResultFromWire } from './profile-format';
import type { ProfileData, StoredResult } from './profile-format';

export const maxBestEntries = 2000;
export const maxTextLength = 64;
export const maxTagLength = 16;
export const maxScoreValues = 8;
export const maxSeed = 4294967295;

const tagPattern = /^[A-Za-z0-9 -]{1,16}$/;

export const parseFailures = [
  'not-an-object',
  'foreign-app',
  'unknown-kind',
  'invalid-version',
  'newer-version',
  'invalid-profile',
  'too-many-results',
] as const;

export type ParseFailure = (typeof parseFailures)[number];

export type ParseResult =
  { ok: true; data: ProfileData; skipped: number } | { ok: false; reason: ParseFailure };

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= maxTextLength;
}

function fail(reason: ParseFailure): ParseResult {
  return { ok: false, reason };
}

function readEntry(raw: unknown): StoredResult | null {
  if (!isPlainObject(raw)) return null;
  const { game, gamev, lvl, seed, score, scorev } = raw;
  if (!isText(game) || !isText(lvl)) return null;
  if (!isNonNegativeSafeInteger(gamev) || !isNonNegativeSafeInteger(scorev)) return null;
  if (!isNonNegativeSafeInteger(seed) || seed > maxSeed) return null;
  if (!Array.isArray(score) || score.length < 1 || score.length > maxScoreValues) return null;
  const values: number[] = [];
  for (const value of score as unknown[]) {
    if (typeof value !== 'number' || !Number.isSafeInteger(value)) return null;
    values.push(value);
  }
  return storedResultFromWire({ game, gamev, lvl, seed, score: values, scorev });
}

/**
 * Same as `parseProfile`, with the migration steps injectable. The newest known version is
 * `steps.length + 1`.
 */
export function parseProfileWith(input: unknown, steps: readonly MigrationStep[]): ParseResult {
  if (!isPlainObject(input)) return fail('not-an-object');
  if (input.app !== APP_ID) return fail('foreign-app');
  if (input.kind !== profileKind) return fail('unknown-kind');

  const version = input.fmtv;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return fail('invalid-version');
  }
  if (version > steps.length + 1) return fail('newer-version');

  let envelope: unknown = input;
  if (version < steps.length + 1) {
    try {
      envelope = migrate(input, version, steps);
    } catch {
      return fail('invalid-profile');
    }
  }
  if (!isPlainObject(envelope)) return fail('invalid-profile');

  const { profile, best } = envelope;
  if (!isPlainObject(profile)) return fail('invalid-profile');
  const { player, tag, symbol, tagat } = profile;
  if (typeof player !== 'string' || !isPlayerId(player)) return fail('invalid-profile');
  if (typeof tag !== 'string' || tag.length > maxTagLength || !tagPattern.test(tag)) {
    return fail('invalid-profile');
  }
  if (!isText(symbol)) return fail('invalid-profile');
  if (!isNonNegativeSafeInteger(tagat)) return fail('invalid-profile');
  if (!Array.isArray(best)) return fail('invalid-profile');
  if (best.length > maxBestEntries) return fail('too-many-results');

  const results: StoredResult[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  for (const raw of best as unknown[]) {
    const entry = readEntry(raw);
    if (entry === null) {
      skipped += 1;
      continue;
    }
    const key = JSON.stringify([entry.gameId, entry.level, entry.scoringVersion]);
    if (seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);
    results.push(entry);
  }

  return {
    ok: true,
    data: {
      profile: profileFromWire({ player, tag, symbol, tagat }),
      best: results,
    },
    skipped,
  };
}

/** Strictly checks the profile part and tolerantly reads the results. Never throws. */
export function parseProfile(input: unknown): ParseResult {
  return parseProfileWith(input, migrationSteps);
}
