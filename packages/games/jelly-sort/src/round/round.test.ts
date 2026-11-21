import { playMoves } from '@mindwhile/core';
import { describe, expect, it } from 'vitest';
import { canPour, hasMove, type Board } from '../common/board/board';
import { generateBoard } from '../generator/generate';
import { createRound } from './round';

const move = (from: number, to: number) => ({ type: 'pour', from, to });

function solutionMoves(level: 'a' | 'b' | 'c', seed: number) {
  return generateBoard(level, seed).solution.map(([from, to]) => move(from, to));
}

// Finds some legal pour sequence that is not the generator's solution, until a dead end
// or the cap; returns the moves played.
function wanderingMoves(level: 'a' | 'b' | 'c', seed: number, cap: number) {
  const round = createRound({ level, seed });
  const played: ReturnType<typeof move>[] = [];
  const n = round.board.trays.length;
  while (played.length < cap && hasMove(round.board)) {
    let found = false;
    for (let from = n - 1; from >= 0 && !found; from -= 1) {
      for (let to = 0; to < n && !found; to += 1) {
        if (canPour(round.board, from, to)) {
          const m = move(from, to);
          round.apply(m);
          played.push(m);
          found = true;
        }
      }
    }
  }
  return played;
}

describe('createRound', () => {
  it('has no result before the board is solved', () => {
    expect(createRound({ level: 'a', seed: 1 }).result()).toBeNull();
  });

  it.each(['a', 'b', 'c'] as const)('wins with deviation 0 on the solution (level %s)', (level) => {
    const round = createRound({ level, seed: 7 });
    const result = playMoves(round, solutionMoves(level, 7));
    expect(result?.roundEnd).toBe('won');
    expect(result?.score[1]).toBe(0);
    expect(round.moves).toHaveLength(round.par);
  });

  it('gives the same round twice for the same seed', () => {
    const a = createRound({ level: 'b', seed: 99 });
    const b = createRound({ level: 'b', seed: 99 });
    expect(a.startBoard).toEqual(b.startBoard);
    expect(a.par).toBe(b.par);
  });

  it('scores worse than par for a longer sequence', () => {
    for (let seed = 0; seed < 300; seed += 1) {
      const round = createRound({ level: 'a', seed });
      const result = playMoves(round, wanderingMoves('a', seed, 200));
      if (result?.roundEnd === 'won' && round.moves.length > round.par) {
        expect(result.score[1]).toBe(round.moves.length - round.par);
        expect(result.score[0]).toBeLessThan(500);
        return;
      }
    }
    throw new Error('no slower win found in 300 seeds');
  });
});

describe('apply', () => {
  it('throws for invalid data', () => {
    const round = createRound({ level: 'a', seed: 1 });
    expect(() => round.apply({ type: 'pick', from: 0, to: 1 })).toThrow();
    expect(() => round.apply({ type: 'pour', from: 0.5, to: 1 })).toThrow();
    expect(() => round.apply({ type: 'pour', from: '0', to: 1 })).toThrow();
    expect(() => round.apply({ type: 'pour', from: -1, to: 1 })).toThrow();
    expect(() => round.apply({ type: 'pour', from: 0, to: 99 })).toThrow();
    expect(() => round.apply({ type: 'pour', from: 0 })).toThrow();
    expect(() => round.apply(null)).toThrow();
  });

  it('ignores rejected pours and does not count them', () => {
    const round = createRound({ level: 'a', seed: 1 });
    const before = round.board;
    const n = before.trays.length;
    round.apply(move(0, 0));
    // pour from an empty tray (the last trays are empty at the start? not guaranteed)
    for (let from = 0; from < n; from += 1) {
      for (let to = 0; to < n; to += 1) {
        if (!canPour(before, from, to)) {
          round.apply(move(from, to));
        }
      }
    }
    expect(round.board).toEqual(before);
    expect(round.moves).toEqual([]);
  });

  it('ignores a pointless pour of a single-color tray into an empty tray', () => {
    const board: Board = { capacity: 2, trays: [[0, 0], []] };
    expect(canPour(board, 0, 1)).toBe(false);
    // On a real round: the solved-looking tray stays untouched.
    const round = createRound({ level: 'a', seed: 1 });
    const n = round.board.trays.length;
    const { trays } = round.board;
    for (let from = 0; from < n; from += 1) {
      const tray = trays[from]!;
      const single = tray.length > 0 && tray.every((c) => c === tray[0]);
      const empty = trays.findIndex((x) => x.length === 0);
      if (single && empty >= 0) {
        round.apply(move(from, empty));
        expect(round.moves).toEqual([]);
      }
    }
  });

  it('ignores moves after the board is solved', () => {
    const round = createRound({ level: 'a', seed: 4 });
    playMoves(round, solutionMoves('a', 4));
    const count = round.moves.length;
    const solved = round.board;
    for (let from = 0; from < solved.trays.length; from += 1) {
      round.apply(move(from, (from + 1) % solved.trays.length));
    }
    expect(round.moves).toHaveLength(count);
    expect(round.board).toEqual(solved);
  });
});

describe('serialize and restore', () => {
  it('replays the moves to the same board and counter', () => {
    const round = createRound({ level: 'b', seed: 3 });
    for (const m of solutionMoves('b', 3).slice(0, 5)) {
      round.apply(m);
    }
    const saved = JSON.parse(JSON.stringify(round.serialize())) as unknown;
    const restored = createRound({ level: 'b', seed: 3, saved });
    expect(restored.board).toEqual(round.board);
    expect(restored.moves).toEqual(round.moves);
    expect(restored.moves).toHaveLength(5);
    expect(round.serialize().moves[0]).toHaveLength(2);
  });

  it('throws for invalid saved data and unknown levels', () => {
    expect(() => createRound({ level: 'a', seed: 1, saved: { moves: [[0]] } })).toThrow();
    expect(() => createRound({ level: 'a', seed: 1, saved: { moves: [[0, 99]] } })).toThrow();
    expect(() => createRound({ level: 'a', seed: 1, saved: { moves: [[0, 1.5]] } })).toThrow();
    expect(() => createRound({ level: 'a', seed: 1, saved: 'x' })).toThrow();
    expect(() => createRound({ level: 'z', seed: 1 })).toThrow('unknown level');
  });
});

describe('dead end', () => {
  it('is lost with [0, 0] and ignores further moves', () => {
    // Search seeds for a wandering walk that dead ends.
    for (let seed = 0; seed < 200; seed += 1) {
      const walk = wanderingMoves('a', seed, 200);
      const round = createRound({ level: 'a', seed });
      const result = playMoves(round, walk);
      if (result?.roundEnd === 'lost') {
        expect(result.score).toEqual([0, 0]);
        expect(hasMove(round.board)).toBe(false);
        const count = round.moves.length;
        round.apply(move(0, 1));
        expect(round.moves).toHaveLength(count);
        return;
      }
    }
    throw new Error('no dead end found in 200 seeds');
  });

  it('wins even if no move is left on the solved board', () => {
    const round = createRound({ level: 'a', seed: 4 });
    const result = playMoves(round, solutionMoves('a', 4));
    expect(result?.roundEnd).toBe('won');
  });
});
