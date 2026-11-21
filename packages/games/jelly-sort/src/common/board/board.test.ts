import { describe, expect, it } from 'vitest';
import { canPour, hasMove, isSolved, pour, solvedBoard, topBlock, type Board } from './board';

const board = (capacity: number, ...trays: number[][]): Board => ({ capacity, trays });

describe('topBlock', () => {
  it('is null for an empty tray', () => {
    expect(topBlock([])).toBeNull();
  });
  it('covers a single-color tray', () => {
    expect(topBlock([2, 2, 2])).toEqual({ color: 2, length: 3 });
  });
  it('covers only the contiguous top run of a mixed tray', () => {
    expect(topBlock([1, 0, 0, 1, 1])).toEqual({ color: 1, length: 2 });
    expect(topBlock([0, 0, 1])).toEqual({ color: 1, length: 1 });
  });
});

describe('canPour', () => {
  it('rejects the same tray, an empty source and out-of-range indices', () => {
    const b = board(4, [0, 1], [], [1]);
    expect(canPour(b, 0, 0)).toBe(false);
    expect(canPour(b, 1, 0)).toBe(false);
    expect(canPour(b, -1, 0)).toBe(false);
    expect(canPour(b, 0, 3)).toBe(false);
    expect(canPour(b, 0.5, 0)).toBe(false);
  });
  it('allows a mixed tray into an empty tray', () => {
    expect(canPour(board(4, [0, 1], []), 0, 1)).toBe(true);
  });
  it('rejects a single-color tray into an empty tray (pointless pour)', () => {
    expect(canPour(board(4, [0, 0], []), 0, 1)).toBe(false);
  });
  it('allows a pour onto the same top color', () => {
    expect(canPour(board(4, [0, 1], [2, 1]), 0, 1)).toBe(true);
  });
  it('merges a single-color tray onto the same color', () => {
    const next = pour(board(4, [1], [0, 1]), 0, 1);
    expect(next.trays).toEqual([[], [0, 1, 1]]);
  });
  it('rejects a different top color', () => {
    expect(canPour(board(4, [0, 1], [2]), 0, 1)).toBe(false);
  });
  it('requires the whole top block to fit', () => {
    const b = board(4, [0, 1, 1], [1, 1]);
    expect(canPour(b, 0, 1)).toBe(true);
    expect(canPour(board(4, [0, 1, 1, 1], [1, 1]), 0, 1)).toBe(false);
    expect(canPour(board(4, [0, 1, 1], [1, 1, 1]), 0, 1)).toBe(false);
  });
});

describe('pour', () => {
  it('moves the whole top block and does not mutate', () => {
    const b = board(4, [0, 1, 1], [1], []);
    const snapshot = JSON.stringify(b);
    const next = pour(b, 0, 1);
    expect(JSON.stringify(b)).toBe(snapshot);
    expect(next.trays).toEqual([[0], [1, 1, 1], []]);
    expect(next.capacity).toBe(4);
  });
  it('throws on an invalid pour', () => {
    expect(() => pour(board(4, [0, 0], []), 0, 1)).toThrow();
  });
});

describe('isSolved', () => {
  it('is true for a solved board', () => {
    expect(isSolved(solvedBoard(3, 4, 2))).toBe(true);
  });
  it('is false with one wrong layer', () => {
    expect(isSolved(board(2, [0, 1], [1, 0], []))).toBe(false);
  });
  it('is false for a partly filled tray', () => {
    expect(isSolved(board(3, [0, 0], [0], []))).toBe(false);
  });
});

describe('hasMove', () => {
  it('is true when a pour exists', () => {
    expect(hasMove(board(2, [0, 1], []))).toBe(true);
  });
  it('is false on a dead end', () => {
    expect(hasMove(board(2, [0, 1], [1, 0]))).toBe(false);
  });
  it('is false for a solved board', () => {
    expect(hasMove(solvedBoard(3, 4, 2))).toBe(false);
  });
});

describe('solvedBoard', () => {
  it('fills tray i with color i, then adds empty trays', () => {
    expect(solvedBoard(2, 3, 2)).toEqual({
      capacity: 3,
      trays: [[0, 0, 0], [1, 1, 1], [], []],
    });
  });
});
