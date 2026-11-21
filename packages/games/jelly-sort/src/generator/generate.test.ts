import { describe, expect, it } from 'vitest';
import { canPour, hasMove, isSolved, pour } from '../common/board/board';
import { levelParams } from '../common/levels/levels';
import type { JellySortLevel } from '../manifest';
import { generateBoard } from './generate';

const levels: JellySortLevel[] = ['a', 'b', 'c'];

describe('generateBoard', () => {
  it.each(levels)('is deterministic and seed dependent (level %s)', (level) => {
    expect(generateBoard(level, 123)).toEqual(generateBoard(level, 123));
    expect(generateBoard(level, 1).board).not.toEqual(generateBoard(level, 2).board);
  });

  it.each(levels)('solution solves the board in exactly par moves (level %s)', (level) => {
    const { minPar, colors, capacity, emptyTrays } = levelParams[level];
    for (let seed = 0; seed < 200; seed += 1) {
      const { board, par, solution } = generateBoard(level, seed);
      expect(par).toBe(solution.length);
      expect(par).toBeGreaterThanOrEqual(minPar);
      expect(isSolved(board)).toBe(false);
      expect(hasMove(board)).toBe(true);
      expect(board.trays).toHaveLength(colors + emptyTrays);
      expect(board.capacity).toBe(capacity);
      const counts = Array<number>(colors).fill(0);
      for (const tray of board.trays) {
        expect(tray.length).toBeLessThanOrEqual(capacity);
        for (const color of tray) counts[color]! += 1;
      }
      expect(counts.every((n) => n === capacity)).toBe(true);
      let current = board;
      for (const [from, to] of solution) {
        expect(canPour(current, from, to)).toBe(true);
        current = pour(current, from, to);
      }
      expect(isSolved(current)).toBe(true);
    }
  });

  it('works for the seed limits', () => {
    for (const level of levels) {
      expect(() => generateBoard(level, 0)).not.toThrow();
      expect(() => generateBoard(level, 4294967295)).not.toThrow();
    }
  });

  it('continues the same stream when a draw is discarded', () => {
    let found = 0;
    for (let seed = 0; seed < 2000 && found < 3; seed += 1) {
      let first;
      try {
        first = generateBoard('a', seed, 1);
      } catch {
        // first draw was discarded: the default limit must still succeed
        const result = generateBoard('a', seed);
        expect(result).toEqual(generateBoard('a', seed));
        expect(() => generateBoard('a', seed, 1)).toThrow();
        found += 1;
        continue;
      }
      expect(generateBoard('a', seed)).toEqual(first);
    }
    expect(found).toBeGreaterThan(0);
  });

  it('throws after the bounded number of draws', () => {
    expect(() => generateBoard('a', 5, 0)).toThrow(/after 0 draws/);
  });
});
