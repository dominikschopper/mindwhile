import { playMoves } from '@mindwhile/core'
import { describe, expect, it } from 'vitest'
import { challengeParams } from './challenges'
import { generateBoard } from './generate'
import { createRound } from './round'
import { boardText, firstDrawPar, pick } from './scoring-util'

// Pinned scoring cases of challenge c (scoring version 0). If one of them fails,
// generator, par or flood logic changed: revert it or raise the scoring version.
const cases = [
  {
    seed: 13,
    board:
      'xoo###-**-x**x/*|o|#x|x##|##*/*-o#x|o-*#**-x/o**-#o#-x*#-x*/#-o||xox#-o|#o/*|o|*o|-*o--#x/#o-x#*|-###xoo/|-o-*-*-o#xx|*/x|x-xo#*|**#|*/o|-*o*-**-oo#x/*#o#-***##*o#|/ox-x#|#|x|*|-#/o|x#-#*-#|-#-#/o-o-xx*|###|o#',
    par: 26,
    moves: [2, 4, 1, 3, 5, 0, 2, 4, 1, 3, 5, 0, 4, 2, 1, 3, 4, 0, 5, 4, 2, 3, 1, 5, 0, 4],
  },
  {
    seed: 224,
    board:
      'x-##*-#|*xo#o#/#o*-##|--x|*o-/x|#**----|*x*x/|||o*ox-|||o*-/*#|o|###-||||o/|o#|#*-##**o-x/-o##o-|#-#-#*o/xo#*o|ox|-#-xo/-#x|#o#-x#-*o|/x#*x|-o-#x||*-/o*-#o#x*xo--x*/*x|-|#x#oxxx--/|xo-x##|o-|o|#/#*#-|*x-||-#*#',
    par: 28,
    moves: [3, 4, 1, 4, 3, 5, 4, 1, 2, 0, 3, 4, 5, 2, 0, 4, 3, 1, 5, 2, 0, 3, 5, 1, 4, 0, 2, 3],
  },
  {
    seed: 3335,
    board:
      'o-o|-|o*o#x#||/-x#x||*x*oo*-*/-x-*##|*o|-o##/*###-#o*#||***/||*-o#xo|x#oxo/|###*o*o*xo*-o/o#||o*x|-ox|##/*|xooo|o-xx-|#/xo*|o#-*--x*x-/##xx---oo*o|xo/|xx*-oooo||-|o/|*xooox|**-#x-/***#o|#o*o**oo/x#|*-**xx*#**#',
    par: 24,
    moves: [3, 0, 4, 1, 4, 5, 2, 1, 0, 2, 3, 1, 5, 0, 4, 2, 1, 3, 4, 5, 2, 0, 3, 1],
  },
  {
    seed: 44446,
    board:
      'x*-x*|##o##o|-/-ooo#||#ox#x|o/*o|#oo#|-**|o|/|-x*#x-#oo|--o/#o|*o-#ox#-x##/oox|*o-#o|x|x|/###*#*ox#-ooox/o--|o|#x*o|*x#/--#-o--*-**o-o/||####-*-*--*x/*|#*xox-*xoo#-/x*o#-*|o**-oo#/*#*o#||x||o|x#/-o|x-**#-o*oox',
    par: 29,
    moves: [1, 2, 3, 2, 4, 5, 1, 4, 2, 3, 4, 0, 5, 1, 2, 3, 4, 1, 2, 0, 5, 3, 2, 4, 0, 1, 2, 3, 5],
  },
  {
    seed: 555557,
    board:
      '|--o|x-x*|-**|/-o#*|ox||o|x--/#-oo*#o|*|-o--/-|#|x|*xx-#--#/o-#|-|o-|xxxo-/*|o-xo--o|**o-/*#xo***xox***#/*x#|#xoo#|ox--/|###-o-#-o*o||/o*#|*o*o-#--*-/-#--#*-o#-|-|-/#x|o*x***x---|/##**xo#-x-#-**/|*#xx--*xo*o**',
    par: 27,
    moves: [3, 2, 4, 2, 5, 3, 2, 1, 0, 4, 5, 2, 3, 1, 4, 5, 0, 1, 3, 2, 0, 3, 4, 1, 5, 2, 3],
  },
]

describe('scoring challenge c', () => {
  it.each(cases)('seed : board, par and greedy play', ({ seed, board, par, moves }) => {
    const generated = generateBoard('c', seed)
    expect(boardText(generated.board)).toBe(board)
    expect(generated.par).toBe(par)
    expect(moves).toHaveLength(par)
    const round = createRound({ challenge: 'c', seed })
    expect(playMoves(round, moves.map(pick))).toEqual({ roundEnd: 'won', score: [1000, 0] })
    expect(round.moves).toHaveLength(par)
  })

  it('redraws a too-easy first board from the same stream', () => {
    const seed = 176
    expect(firstDrawPar('c', seed)).toBeLessThan(challengeParams.c.minPar)
    const generated = generateBoard('c', seed)
    expect(boardText(generated.board)).toBe(
      'o|x#---|*--|**/*x|o##-xxo-*x|/|o*#--#*-*o---/|xx|-o-x*o|-|*/|o---*-o#-o#ox/oxo|o#***x#|-*/*#|o*#|*|#x*-|/#-x**|ox#o##ox/|-xo-xo|x-*-|#/-*-**#o||o-#-|/||||-||oo*|-|*/#*|o-oxxoo|-*o/*##--|oo-|*x|-/|oo|-||***o#*#',
    )
    expect(generated.par).toBe(24)
    expect(generated.par).toBeGreaterThanOrEqual(challengeParams.c.minPar)
  })

  it('chooses the lowest color index on a greedy tie', () => {
    // seed 0 has at least one step where two colors absorb the same number of cells
    const round = createRound({ challenge: 'c', seed: 0 })
    expect(boardText(round.startBoard)).toBe(
      'o*#xx||o-xo-*-/ox|o##*-o#o#|-/-*-x*|*oxx*o#o/x|**x|o##oxo#-/|xooxo|------o/*o|x*-*xx*#-#-/x--*o#xo-#x#x-/xxo--x-xxx*x-#/x#oxx##*x|-**#/ooo#oo*-xo#x|#/|**||*-|*#o|o#/#*-|o|-##-o***/|-o**|xx*-o|o#/###o-o#x*|o#|*',
    )
    expect(round.par).toBe(29)
    const moves = [
      0, 1, 3, 0, 1, 5, 2, 0, 1, 3, 2, 0, 4, 3, 0, 1, 2, 4, 3, 5, 1, 2, 4, 0, 3, 5, 1, 2, 4,
    ]
    expect(playMoves(round, moves.map(pick))).toEqual({ roundEnd: 'won', score: [1000, 0] })
  })
})
