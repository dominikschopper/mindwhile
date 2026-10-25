import { playMoves } from '@mindwhile/core'
import { describe, expect, it } from 'vitest'
import { challengeParams } from './challenges'
import { generateBoard } from './generate'
import { createRound } from './round'
import { boardText, firstDrawPar, pick } from './scoring-util'

// Pinned scoring cases of challenge b (scoring version 0). If one of them fails,
// generator, par or flood logic changed: revert it or raise the scoring version.
const cases = [
  {
    seed: 12,
    board:
      'x*oxx-#--x/o#-#x-ox*o/-**#x###*x/#xx#o*oo-x/-####o#-xx/x---##*-xx/ooox-##oox/-o*o---xox/*-o*ox*--o/x-#ox*xoo#',
    par: 13,
    moves: [1, 2, 0, 4, 3, 2, 0, 1, 3, 2, 4, 0, 1],
  },
  {
    seed: 223,
    board:
      'o*#**o*-*#/##**-x-x-*/xo*ox*--*#/#**#-o#o*#/oo*xxo##ox/x-*-oxo##*/#**o-o*oo-/-#x*-#*x#-/x-####oox#/##o#-x--o-',
    par: 14,
    moves: [4, 1, 2, 0, 4, 3, 2, 1, 4, 0, 2, 3, 1, 4],
  },
  {
    seed: 3334,
    board:
      '*#xxo#x*#-/*#o*o##*--/#*oxooxo-#/o#ox#*---o/-o#-xoo**#/oxoo*#x*o*/o#-#x-#x-#/ox-*xo-**o/--o*-xx*--/x#oxo-#-*x',
    par: 20,
    moves: [4, 2, 0, 2, 4, 1, 3, 2, 0, 4, 1, 3, 0, 2, 1, 3, 4, 0, 1, 2],
  },
  {
    seed: 44445,
    board:
      '*o*x-##o#-/#-oo*o#-xx/#xx-#ox-**/**x#*ox*o#/o#*x*#xx*#/ooxxoxxx*#/x*#o#**#x-/#ooxx--*o#/*#*x**#xxx/*##x#x-oo-',
    par: 17,
    moves: [4, 0, 1, 2, 0, 1, 2, 4, 0, 1, 3, 4, 0, 2, 3, 1, 4],
  },
  {
    seed: 555556,
    board:
      'xo#-*-#x-x/--*oo-xxxx/*x#x#*o--#/-##ooooxoo/**xxo*x-o*/xx#-x*oxo#/oxxoxo-##*/x*#oxxxox*/-xx--*x*#o/#o##*x*#oo',
    par: 15,
    moves: [3, 1, 4, 2, 0, 3, 1, 4, 2, 0, 1, 4, 0, 2, 3],
  },
]

describe('scoring challenge b', () => {
  it.each(cases)('seed : board, par and greedy play', ({ seed, board, par, moves }) => {
    const generated = generateBoard('b', seed)
    expect(boardText(generated.board)).toBe(board)
    expect(generated.par).toBe(par)
    expect(moves).toHaveLength(par)
    const round = createRound({ challenge: 'b', seed })
    expect(playMoves(round, moves.map(pick))).toEqual({ roundEnd: 'won', score: [750, 0] })
    expect(round.moves).toHaveLength(par)
  })

  it('redraws a too-easy first board from the same stream', () => {
    const seed = 61
    expect(firstDrawPar('b', seed)).toBeLessThan(challengeParams.b.minPar)
    const generated = generateBoard('b', seed)
    expect(boardText(generated.board)).toBe(
      '-**#-o**-o/#--ooo***o/o*oxx#xxxo/*-ox-oo#-*/-o-oxox-x-/ox#*oo**#*/o*oxxoox*o/o*x-#-oxx#/-#*xxx*o*o/*##-o**o#o',
    )
    expect(generated.par).toBe(15)
    expect(generated.par).toBeGreaterThanOrEqual(challengeParams.b.minPar)
  })

  it('chooses the lowest color index on a greedy tie', () => {
    // seed 0 has at least one step where two colors absorb the same number of cells
    const round = createRound({ challenge: 'b', seed: 0 })
    expect(boardText(round.startBoard)).toBe(
      '-o*#*xxox-/-#-#*-x#-x/-x#o-*oo#o/*#-x-*#*o*/x**xoooxxx/-#xx*-*x#-/#o-#*-x#*#/*#x**o#-o-/xoo*-x*o*#/o#*o-xo-x#',
    )
    expect(round.par).toBe(17)
    const moves = [0, 4, 1, 0, 3, 1, 2, 0, 4, 3, 1, 2, 0, 3, 4, 0, 1]
    expect(playMoves(round, moves.map(pick))).toEqual({ roundEnd: 'won', score: [750, 0] })
  })

  it('scores a detour above par with a positive deviation', () => {
    // seed 12: par is 13. The first move is a detour (color 2 absorbs one cell, not the
    // greedy choice), then the greedy solution of the resulting board follows: 14 moves.
    // points = floor(750 * 13 / 14 / 10) * 10 = floor(69.64) * 10 = 690, deviation 14 - 13 = 1
    const round = createRound({ challenge: 'b', seed: 12 })
    expect(round.par).toBe(13)
    const moves = [2, 1, 2, 0, 4, 3, 2, 0, 1, 3, 2, 4, 0, 1]
    expect(moves).toHaveLength(14)
    expect(playMoves(round, moves.map(pick))).toEqual({ roundEnd: 'won', score: [690, 1] })
    expect(round.moves).toHaveLength(14)
  })
})
