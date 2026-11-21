import { describe, expect, it } from 'vitest';
import { levelParams } from '../common/levels/levels';
import { pointsFor } from './points';

describe('pointsFor', () => {
  it.each(['a', 'b', 'c'] as const)('gives the base value on par (level %s)', (level) => {
    expect(pointsFor(level, 12, 12)).toBe(levelParams[level].basePoints);
  });

  it('gives more points for fewer moves and fewer for more moves', () => {
    expect(pointsFor('a', 10, 10)).toBe(500);
    expect(pointsFor('a', 9, 10)).toBe(550);
    expect(pointsFor('a', 8, 10)).toBe(620);
    expect(pointsFor('a', 12, 10)).toBe(410);
  });

  it('rounds down to steps of ten', () => {
    // 750 * 16 / 17 = 705.88 -> 700
    expect(pointsFor('b', 17, 16)).toBe(700);
    // 1000 * 22 / 23 = 956.5 -> 950
    expect(pointsFor('c', 23, 22)).toBe(950);
    for (let moves = 1; moves < 80; moves += 1) {
      expect(pointsFor('c', moves, 22) % 10).toBe(0);
    }
  });

  it('never gets negative', () => {
    expect(pointsFor('a', 100000, 10)).toBe(0);
  });

  it('rejects zero or invalid move counts', () => {
    expect(() => pointsFor('a', 0, 10)).toThrow(RangeError);
    expect(() => pointsFor('a', 1.5, 10)).toThrow(RangeError);
  });
});
