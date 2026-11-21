import { playMoves } from '@mindwhile/core';
import { describe, expect, it } from 'vitest';
import { generateBoard } from '../generator/generate';
import { createRound } from '../round/round';
import { boardText, pourMove, pourMoves } from './scoring-util';

// Pinned scoring cases of level b (scoring version 0). If one of them fails,
// generator, par, round logic or level numbers changed: revert it or raise the scoring version.
// board: one group per tray, layers bottom to top. wander: always the first legal pour from
// the last tray, longer than par on most seeds. best: shortest solution found by search.
const cases = [
  {
    seed: 1,
    board: './bbec/cada/./ecad/fffe/bbae/fdcd',
    par: 16,
    solution: [
      [7, 3],
      [4, 3],
      [2, 0],
      [2, 3],
      [4, 0],
      [7, 4],
      [7, 3],
      [1, 4],
      [6, 1],
      [2, 0],
      [4, 2],
      [5, 4],
      [1, 4],
      [7, 5],
      [6, 0],
      [6, 1],
    ],
    solutionResult: { roundEnd: 'won', score: [750, 0] },
    wander: [
      [7, 0],
      [7, 3],
      [7, 0],
      [4, 0],
      [2, 4],
      [2, 0],
      [4, 2],
      [4, 3],
      [6, 4],
      [5, 4],
      [7, 5],
      [6, 7],
      [2, 7],
      [3, 2],
      [1, 2],
      [1, 3],
      [6, 1],
      [4, 3],
    ],
    wanderResult: { roundEnd: 'won', score: [660, 2] },
    best: [
      [2, 0],
      [2, 3],
      [2, 0],
      [1, 2],
      [4, 3],
      [4, 0],
      [4, 2],
      [1, 4],
      [5, 4],
      [6, 4],
      [6, 0],
      [1, 6],
      [7, 3],
      [7, 2],
      [7, 3],
      [5, 7],
    ],
    bestResult: { roundEnd: 'won', score: [750, 0] },
  },
  {
    seed: 42,
    board: 'f/becb/caf/dafc/eeed/f/bbc/adda',
    par: 16,
    solution: [
      [2, 0],
      [3, 6],
      [0, 5],
      [7, 0],
      [3, 5],
      [3, 0],
      [2, 0],
      [6, 2],
      [1, 6],
      [7, 3],
      [7, 0],
      [1, 7],
      [4, 3],
      [7, 2],
      [1, 4],
      [6, 1],
    ],
    solutionResult: { roundEnd: 'won', score: [750, 0] },
    wander: [
      [5, 0],
      [7, 5],
      [4, 7],
      [3, 6],
      [3, 0],
      [5, 3],
      [7, 5],
      [7, 3],
      [6, 7],
      [2, 0],
      [1, 6],
      [1, 7],
      [1, 4],
      [6, 1],
      [3, 6],
      [5, 3],
      [2, 5],
      [7, 2],
      [6, 5],
    ],
    wanderResult: { roundEnd: 'won', score: [630, 3] },
    best: [
      [0, 2],
      [2, 5],
      [3, 6],
      [3, 5],
      [3, 2],
      [4, 3],
      [7, 2],
      [7, 3],
      [2, 7],
      [6, 2],
      [1, 6],
      [1, 2],
      [1, 4],
      [1, 6],
    ],
    bestResult: { roundEnd: 'won', score: [850, -2] },
  },
  {
    seed: 777,
    board: 'aada/badb/ccfe/././beeb/fffd/ccde',
    par: 16,
    solution: [
      [7, 4],
      [5, 3],
      [1, 3],
      [5, 4],
      [3, 5],
      [1, 3],
      [0, 1],
      [0, 3],
      [2, 4],
      [1, 0],
      [5, 1],
      [7, 3],
      [6, 3],
      [2, 5],
      [6, 5],
      [7, 2],
    ],
    solutionResult: { roundEnd: 'won', score: [750, 0] },
    wander: [
      [7, 3],
      [7, 4],
      [6, 4],
      [2, 3],
      [2, 6],
      [7, 2],
      [5, 7],
      [5, 3],
      [7, 5],
      [1, 5],
      [1, 4],
      [1, 7],
      [5, 1],
      [0, 5],
      [7, 5],
      [0, 4],
      [5, 0],
    ],
    wanderResult: { roundEnd: 'won', score: [700, 1] },
    best: [
      [1, 3],
      [1, 4],
      [0, 1],
      [0, 4],
      [1, 0],
      [1, 3],
      [2, 1],
      [5, 3],
      [5, 1],
      [3, 5],
      [6, 4],
      [2, 6],
      [7, 1],
      [7, 4],
      [2, 7],
    ],
    bestResult: { roundEnd: 'won', score: [800, -1] },
  },
  {
    seed: 2024,
    board: 'ad/beaa/cfd/./edad/fcf/bbbf/ccee',
    par: 16,
    solution: [
      [4, 2],
      [0, 3],
      [4, 0],
      [1, 0],
      [3, 4],
      [2, 3],
      [5, 2],
      [4, 3],
      [7, 4],
      [7, 5],
      [1, 4],
      [6, 2],
      [2, 7],
      [6, 1],
      [5, 2],
      [7, 5],
    ],
    solutionResult: { roundEnd: 'won', score: [750, 0] },
    wander: [
      [7, 3],
      [6, 5],
      [4, 0],
      [2, 0],
      [5, 2],
      [7, 5],
      [5, 7],
      [2, 5],
      [7, 2],
      [4, 7],
      [1, 7],
      [3, 1],
      [4, 3],
      [1, 4],
      [6, 1],
      [0, 3],
      [7, 0],
    ],
    wanderResult: { roundEnd: 'won', score: [700, 1] },
    best: [
      [0, 2],
      [1, 0],
      [2, 3],
      [4, 3],
      [4, 0],
      [4, 3],
      [1, 4],
      [5, 2],
      [6, 2],
      [1, 6],
      [7, 4],
      [5, 7],
      [2, 5],
      [2, 7],
    ],
    bestResult: { roundEnd: 'won', score: [850, -2] },
  },
  {
    seed: 31337,
    board: 'aeed/bbbb/./cd/edd/feac/ffac/fac',
    par: 16,
    solution: [
      [3, 2],
      [2, 4],
      [7, 2],
      [5, 2],
      [3, 2],
      [6, 3],
      [6, 5],
      [3, 2],
      [4, 3],
      [5, 7],
      [0, 3],
      [5, 0],
      [0, 4],
      [7, 0],
      [7, 6],
      [6, 5],
    ],
    solutionResult: { roundEnd: 'won', score: [750, 0] },
    wander: [
      [7, 2],
      [6, 2],
      [7, 6],
      [5, 2],
      [4, 3],
    ],
    wanderResult: { roundEnd: 'lost', score: [0, 0] },
    best: [
      [0, 2],
      [3, 2],
      [4, 2],
      [0, 4],
      [5, 3],
      [5, 0],
      [5, 4],
      [6, 3],
      [6, 0],
      [5, 6],
      [7, 3],
      [7, 0],
      [6, 7],
    ],
    bestResult: { roundEnd: 'won', score: [920, -3] },
  },
] as const;

const lowerThanPar = cases.find((c) => c.seed === 42)!;

describe('scoring level b', () => {
  it.each(cases)(
    'seed $seed: board, par and solution',
    ({ seed, board, par, solution, solutionResult }) => {
      const generated = generateBoard('b', seed);
      expect(boardText(generated.board)).toBe(board);
      expect(generated.par).toBe(par);
      expect(generated.solution).toEqual(solution);
      const round = createRound({ level: 'b', seed });
      expect(playMoves(round, pourMoves(solution))).toEqual(solutionResult);
    },
  );

  it.each(cases)('seed $seed: a wandering sequence', ({ seed, wander, wanderResult }) => {
    const round = createRound({ level: 'b', seed });
    expect(playMoves(round, pourMoves(wander))).toEqual(wanderResult);
    expect(round.moves).toHaveLength(wander.length);
  });

  it.each(cases)('seed $seed: the shortest known sequence', ({ seed, best, bestResult }) => {
    const round = createRound({ level: 'b', seed });
    expect(playMoves(round, pourMoves(best))).toEqual(bestResult);
  });

  it('scores a negative deviation for a sequence shorter than par', () => {
    const { seed, par, best, bestResult } = lowerThanPar;
    expect(best.length).toBeLessThan(par);
    expect(bestResult.score[1]).toBe(best.length - par);
    const round = createRound({ level: 'b', seed });
    expect(playMoves(round, pourMoves(best))).toEqual(bestResult);
  });

  it('does not count a pointless pour', () => {
    // a single-colored tray into an empty tray changes nothing and is ignored
    const round = createRound({ level: 'b', seed: 31337 });
    const before = boardText(round.board);
    const [from, to] = [1, 2];
    round.apply(pourMove(from, to));
    expect(round.moves).toHaveLength(0);
    expect(boardText(round.board)).toBe(before);
    expect(round.result()).toBeNull();
  });

  it('ends in a dead end with no points', () => {
    const round = createRound({ level: 'b', seed: 31337 });
    const dead: [number, number][] = [
      [7, 2],
      [6, 2],
      [7, 6],
      [5, 2],
      [4, 3],
    ];
    expect(playMoves(round, pourMoves(dead))).toEqual({ roundEnd: 'lost', score: [0, 0] });
    expect(round.moves).toHaveLength(dead.length);
  });
});
