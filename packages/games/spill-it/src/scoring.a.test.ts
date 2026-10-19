import { playMoves } from '@mindwhile/core'
import { describe, expect, it } from 'vitest'
import { challengeParams } from './challenges'
import { generateBoard } from './generate'
import { createRound } from './round'
import { boardText, firstDrawPar, pick } from './scoring-util'

// Pinned scoring cases of challenge a (scoring version 0). If one of them fails,
// generator, par or flood logic changed: revert it or raise the scoring version.
const cases = [
  {
    seed: 11,
    board: '-x*oox/o-xo*x/-**ooo/x**--o/oo-oxx/*oo-o*',
    par: 9,
    moves: [0, 1, 2, 0, 1, 2, 3, 0, 1],
  },
  {
    seed: 222,
    board: '-oxo-x/**-o*o/x-**o*/o*x*-x/*****x/*oxxo-',
    par: 9,
    moves: [1, 3, 1, 0, 2, 3, 1, 0, 2],
  },
  {
    seed: 3333,
    board: '*-**-*/-oox**/-x*xxo/o-*--o/x-o-**/--ox-o',
    par: 10,
    moves: [3, 2, 0, 1, 3, 2, 1, 0, 2, 3],
  },
  {
    seed: 44444,
    board: '*oox*-/x--o-x/o*o**o/xxxooo/-***ox/---x-o',
    par: 10,
    moves: [2, 0, 2, 1, 2, 0, 3, 1, 0, 2],
  },
  {
    seed: 555555,
    board: '-ooxoo/**oxo*/x*ooo-/ox*x-*/*oo**-/x*xx**',
    par: 8,
    moves: [2, 1, 0, 1, 2, 3, 1, 0],
  },
]

describe('scoring challenge a', () => {
  it.each(cases)('seed : board, par and greedy play', ({ seed, board, par, moves }) => {
    const generated = generateBoard('a', seed)
    expect(boardText(generated.board)).toBe(board)
    expect(generated.par).toBe(par)
    expect(moves).toHaveLength(par)
    const round = createRound({ challenge: 'a', seed })
    expect(playMoves(round, moves.map(pick))).toEqual({ roundEnd: 'won', score: [500, 0] })
    expect(round.moves).toHaveLength(par)
  })

  it('redraws a too-easy first board from the same stream', () => {
    const seed = 312
    expect(firstDrawPar('a', seed)).toBeLessThan(challengeParams.a.minPar)
    const generated = generateBoard('a', seed)
    expect(boardText(generated.board)).toBe('x*xoo-/**ooxx/oox**o/oxox*o/oo-oo-/oo**x*')
    expect(generated.par).toBe(8)
    expect(generated.par).toBeGreaterThanOrEqual(challengeParams.a.minPar)
  })

  it('chooses the lowest color index on a greedy tie', () => {
    // seed 0 has at least one step where two colors absorb the same number of cells
    const round = createRound({ challenge: 'a', seed: 0 })
    expect(boardText(round.startBoard)).toBe('o-xxx*/-o*oo*/--oo*o/xo**xo/xo--*-/*o*--o')
    expect(round.par).toBe(8)
    const moves = [3, 2, 1, 0, 3, 2, 1, 3]
    expect(playMoves(round, moves.map(pick))).toEqual({ roundEnd: 'won', score: [500, 0] })
  })

  it('scores a negative deviation for a sequence shorter than par', () => {
    // seed 0: greedy par is 8, this 7-move sequence was found by search
    const round = createRound({ challenge: 'a', seed: 0 })
    expect(round.par).toBe(8)
    expect(playMoves(round, [3, 2, 1, 0, 1, 3, 2].map(pick))).toEqual({
      roundEnd: 'won',
      score: [570, -1],
    })
  })
})
