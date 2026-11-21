import { playMoves } from '@mindwhile/core';
import { describe, expect, it } from 'vitest';
import { generateBoard } from '../generator/generate';
import { createRound } from '../round/round';
import { boardText, pourMove, pourMoves } from './scoring-util';

// Pinned scoring cases of level a (scoring version 0). If one of them fails,
// generator, par, round logic or level numbers changed: revert it or raise the scoring version.
// board: one group per tray, layers bottom to top. wander: always the first legal pour from
// the last tray, longer than par on most seeds. best: shortest solution found by search.
const cases = [
  {
    seed: 1,
    board: 'aad/./cab/db/dadb/cccb',
    par: 10,
    solution: [
      [4, 2],
      [2, 1],
      [3, 1],
      [4, 3],
      [4, 2],
      [0, 3],
      [4, 3],
      [5, 1],
      [2, 0],
      [5, 2],
    ],
    solutionResult: { roundEnd: 'won', score: [500, 0] },
    wander: [
      [5, 1],
      [4, 1],
      [4, 0],
      [3, 1],
      [2, 1],
      [4, 2],
      [4, 3],
      [2, 4],
      [5, 2],
      [0, 3],
      [4, 0],
    ],
    wanderResult: { roundEnd: 'won', score: [450, 1] },
    best: [
      [2, 1],
      [3, 1],
      [0, 3],
      [2, 0],
      [4, 1],
      [4, 3],
      [4, 0],
      [3, 4],
      [5, 1],
      [2, 5],
    ],
    bestResult: { roundEnd: 'won', score: [500, 0] },
  },
  {
    seed: 42,
    board: 'a/bb/cd/cdaa/cdca/bbd',
    par: 10,
    solution: [
      [3, 0],
      [4, 0],
      [5, 2],
      [3, 2],
      [3, 4],
      [5, 1],
      [2, 3],
      [4, 2],
      [4, 3],
      [4, 2],
    ],
    solutionResult: { roundEnd: 'won', score: [500, 0] },
    wander: [
      [5, 2],
      [5, 1],
      [4, 0],
      [4, 5],
      [4, 2],
      [5, 4],
      [3, 0],
      [3, 5],
      [4, 3],
      [2, 4],
      [5, 4],
      [3, 2],
    ],
    wanderResult: { roundEnd: 'won', score: [410, 2] },
    best: [
      [2, 5],
      [3, 0],
      [4, 0],
      [2, 4],
      [3, 2],
      [4, 3],
      [4, 2],
      [3, 4],
      [5, 2],
      [1, 5],
    ],
    bestResult: { roundEnd: 'won', score: [500, 0] },
  },
  {
    seed: 777,
    board: 'adda/bbc/./ddc/abc/abc',
    par: 10,
    solution: [
      [5, 2],
      [4, 1],
      [1, 2],
      [4, 5],
      [0, 4],
      [5, 1],
      [3, 2],
      [0, 3],
      [5, 4],
      [4, 0],
    ],
    solutionResult: { roundEnd: 'won', score: [500, 0] },
    wander: [
      [5, 1],
      [5, 2],
      [4, 3],
      [4, 2],
      [5, 4],
      [3, 5],
      [1, 5],
      [2, 1],
      [0, 2],
      [4, 2],
      [0, 3],
      [2, 0],
    ],
    wanderResult: { roundEnd: 'won', score: [410, 2] },
    best: [
      [1, 2],
      [3, 2],
      [4, 2],
      [4, 1],
      [0, 4],
      [0, 3],
      [0, 4],
      [5, 2],
      [5, 1],
      [4, 5],
    ],
    bestResult: { roundEnd: 'won', score: [500, 0] },
  },
  {
    seed: 2024,
    board: 'ad/c/ccca/ddab/bab/db',
    par: 10,
    solution: [
      [4, 5],
      [2, 4],
      [3, 5],
      [3, 4],
      [1, 2],
      [0, 3],
      [4, 0],
      [5, 1],
      [5, 3],
      [4, 1],
    ],
    solutionResult: { roundEnd: 'won', score: [500, 0] },
    wander: [
      [5, 4],
      [5, 0],
      [4, 5],
      [3, 5],
      [4, 3],
      [5, 4],
      [3, 5],
      [2, 5],
      [2, 1],
      [0, 2],
      [5, 0],
      [3, 2],
    ],
    wanderResult: { roundEnd: 'won', score: [410, 2] },
    best: [
      [3, 4],
      [2, 3],
      [1, 2],
      [4, 5],
      [3, 4],
      [0, 3],
      [4, 0],
      [5, 4],
      [3, 5],
    ],
    bestResult: { roundEnd: 'won', score: [550, -1] },
  },
  {
    seed: 31337,
    board: 'dbcd/bbbd/./daac/aacc/.',
    par: 10,
    solution: [
      [0, 5],
      [3, 2],
      [4, 2],
      [0, 2],
      [1, 5],
      [0, 1],
      [0, 5],
      [3, 0],
      [5, 3],
      [4, 0],
    ],
    solutionResult: { roundEnd: 'won', score: [500, 0] },
    wander: [
      [4, 2],
      [3, 2],
      [3, 4],
      [1, 3],
      [0, 3],
      [0, 2],
      [0, 1],
      [3, 0],
    ],
    wanderResult: { roundEnd: 'won', score: [620, -2] },
    best: [
      [3, 2],
      [4, 2],
      [3, 4],
      [0, 3],
      [0, 2],
      [1, 3],
      [0, 1],
      [0, 3],
    ],
    bestResult: { roundEnd: 'won', score: [620, -2] },
  },
] as const;

const lowerThanPar = cases.find((c) => c.seed === 2024)!;

describe('scoring level a', () => {
  it.each(cases)(
    'seed $seed: board, par and solution',
    ({ seed, board, par, solution, solutionResult }) => {
      const generated = generateBoard('a', seed);
      expect(boardText(generated.board)).toBe(board);
      expect(generated.par).toBe(par);
      expect(generated.solution).toEqual(solution);
      const round = createRound({ level: 'a', seed });
      expect(playMoves(round, pourMoves(solution))).toEqual(solutionResult);
    },
  );

  it.each(cases)('seed $seed: a wandering sequence', ({ seed, wander, wanderResult }) => {
    const round = createRound({ level: 'a', seed });
    expect(playMoves(round, pourMoves(wander))).toEqual(wanderResult);
    expect(round.moves).toHaveLength(wander.length);
  });

  it.each(cases)('seed $seed: the shortest known sequence', ({ seed, best, bestResult }) => {
    const round = createRound({ level: 'a', seed });
    expect(playMoves(round, pourMoves(best))).toEqual(bestResult);
  });

  it('scores a negative deviation for a sequence shorter than par', () => {
    const { seed, par, best, bestResult } = lowerThanPar;
    expect(best.length).toBeLessThan(par);
    expect(bestResult.score[1]).toBe(best.length - par);
    const round = createRound({ level: 'a', seed });
    expect(playMoves(round, pourMoves(best))).toEqual(bestResult);
  });

  it('does not count a pointless pour', () => {
    // a single-colored tray into an empty tray changes nothing and is ignored
    const round = createRound({ level: 'a', seed: 5 });
    const before = boardText(round.board);
    const [from, to] = [2, 1];
    round.apply(pourMove(from, to));
    expect(round.moves).toHaveLength(0);
    expect(boardText(round.board)).toBe(before);
    expect(round.result()).toBeNull();
  });

  it('ends in a dead end with no points', () => {
    const round = createRound({ level: 'a', seed: 5 });
    const dead: [number, number][] = [
      [5, 1],
      [2, 4],
      [5, 2],
    ];
    expect(playMoves(round, pourMoves(dead))).toEqual({ roundEnd: 'lost', score: [0, 0] });
    expect(round.moves).toHaveLength(dead.length);
  });
});
