import { describe, expect, it } from 'vitest';
import type { ScorePosition } from './contract';
import { compareScores, isBetterScore } from './score';

const higher: readonly ScorePosition[] = [{ key: 'points', better: 'higher' }];
const lower: readonly ScorePosition[] = [{ key: 'moves', better: 'lower' }];
const mixed: readonly ScorePosition[] = [
  { key: 'points', better: 'higher' },
  { key: 'moves', better: 'lower' },
];

describe('compareScores', () => {
  it('prefers the higher value when higher is better', () => {
    expect(compareScores([510], [500], higher)).toBe(1);
    expect(compareScores([500], [510], higher)).toBe(-1);
  });

  it('prefers the lower value when lower is better', () => {
    expect(compareScores([3], [4], lower)).toBe(1);
    expect(compareScores([4], [3], lower)).toBe(-1);
  });

  it('lets the second position decide on a tie in the first', () => {
    expect(compareScores([500, 3], [500, 4], mixed)).toBe(1);
    expect(compareScores([500, 4], [500, 3], mixed)).toBe(-1);
  });

  it('uses the first position when it differs, regardless of later positions', () => {
    expect(compareScores([510, 9], [500, 3], mixed)).toBe(1);
    expect(compareScores([500, 4], [510, 9], mixed)).toBe(-1);
  });

  it('returns 0 for equal lists', () => {
    expect(compareScores([500, 3], [500, 3], mixed)).toBe(0);
    expect(compareScores([0], [0], higher)).toBe(0);
  });

  it('returns undefined when the length differs from scoring', () => {
    expect(compareScores([500], [500, 3], mixed)).toBeUndefined();
    expect(compareScores([500, 3], [500], mixed)).toBeUndefined();
    expect(compareScores([500, 3, 1], [500, 3], mixed)).toBeUndefined();
  });

  it('returns undefined when scoring is empty', () => {
    expect(compareScores([], [], [])).toBeUndefined();
    expect(compareScores([1], [2], [])).toBeUndefined();
  });

  it('does not change the inputs', () => {
    const a = [500, 3];
    const b = [510, 9];
    compareScores(a, b, mixed);
    expect(a).toEqual([500, 3]);
    expect(b).toEqual([510, 9]);
  });
});

describe('isBetterScore', () => {
  it('is true only when the candidate is strictly better', () => {
    expect(isBetterScore([510], [500], higher)).toBe(true);
    expect(isBetterScore([500], [510], higher)).toBe(false);
    expect(isBetterScore([3], [4], lower)).toBe(true);
  });

  it('is false for equal scores', () => {
    expect(isBetterScore([500, 3], [500, 3], mixed)).toBe(false);
  });

  it('is false when the scores are not comparable', () => {
    expect(isBetterScore([500], [500, 3], mixed)).toBe(false);
    expect(isBetterScore([1], [0], [])).toBe(false);
  });
});
