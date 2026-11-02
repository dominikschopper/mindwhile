import type { ScorePosition } from './contract';
import type { StoredResult } from './profile-format';
import { isBetterScore } from './score';

function isSameKey(
  entry: StoredResult,
  gameId: string,
  level: string,
  scoringVersion: number,
): boolean {
  return (
    entry.gameId === gameId && entry.level === level && entry.scoringVersion === scoringVersion
  );
}

/** Returns the stored best result for one game, level and scoring version, if there is one. */
export function findBest(
  list: readonly StoredResult[],
  gameId: string,
  level: string,
  scoringVersion: number,
): StoredResult | undefined {
  return list.find((entry) => isSameKey(entry, gameId, level, scoringVersion));
}

/**
 * Returns a new list with `entry` recorded as the best result for its game, level and
 * scoring version. A new key is appended; an existing entry is replaced in place only when
 * the new score is strictly better. The input list and its entries are never changed.
 */
export function recordResult(
  list: readonly StoredResult[],
  entry: StoredResult,
  scoring: readonly ScorePosition[],
): StoredResult[] {
  const index = list.findIndex((existing) =>
    isSameKey(existing, entry.gameId, entry.level, entry.scoringVersion),
  );
  if (index === -1) {
    return [...list, entry];
  }
  const existing = list[index];
  if (existing === undefined || !isBetterScore(entry.scoreValues, existing.scoreValues, scoring)) {
    return [...list];
  }
  return list.map((item, position) => (position === index ? entry : item));
}
