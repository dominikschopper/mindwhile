import type { ScorePosition } from './contract';

/**
 * Compares two score lists position by position. Returns 1 when `a` is better,
 * -1 when `b` is better, 0 when equal on every position, and undefined when the
 * lists are not comparable (length mismatch or empty scoring).
 */
export function compareScores(
  a: readonly number[],
  b: readonly number[],
  scoring: readonly ScorePosition[],
): -1 | 0 | 1 | undefined {
  if (scoring.length === 0 || a.length !== scoring.length || b.length !== scoring.length) {
    return undefined;
  }
  for (const [i, position] of scoring.entries()) {
    // Lengths are checked above, the fallback only satisfies the index types.
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x === y) continue;
    const aIsBetter = position.better === 'higher' ? x > y : x < y;
    return aIsBetter ? 1 : -1;
  }
  return 0;
}

/** True only when `candidate` is strictly better than `current`; not comparable counts as not better. */
export function isBetterScore(
  candidate: readonly number[],
  current: readonly number[],
  scoring: readonly ScorePosition[],
): boolean {
  return compareScores(candidate, current, scoring) === 1;
}
