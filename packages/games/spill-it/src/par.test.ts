import { describe, expect, it } from 'vitest'
import type { Board } from './board'
import { applyColor, isSolved } from './flood'
import { greedyMoves, greedyPar } from './par'

function board(size: number, rows: string): Board {
  return { size, cells: [...rows.replace(/\s/g, '')].map(Number) }
}

describe('greedyPar', () => {
  it('is 0 for a solved board', () => {
    expect(greedyPar(board(2, '11 11'), 2)).toBe(0)
  })

  it('counts the steps on a small two-color board', () => {
    expect(greedyPar(board(2, '01 10'), 2)).toBe(2)
  })

  it('takes the color that absorbs the most cells', () => {
    // color 1 absorbs many cells, color 2 touches nothing
    expect(greedyMoves(board(3, '011 121 111'), 3)[0]).toBe(1)
  })

  it('breaks a tie with the lowest color index', () => {
    // colors 1 and 2 would each absorb exactly one cell
    expect(greedyMoves(board(2, '01 20'), 3)[0]).toBe(1)
  })

  it('equals the length of greedyMoves and solves the board', () => {
    const b = board(3, '012 120 201')
    const moves = greedyMoves(b, 3)
    expect(greedyPar(b, 3)).toBe(moves.length)
    expect(isSolved(moves.reduce(applyColor, b))).toBe(true)
  })
})
