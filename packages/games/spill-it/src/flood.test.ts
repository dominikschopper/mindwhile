import { describe, expect, it } from 'vitest'
import { neighbors, type Board } from './board'
import { levelParams } from './levels'
import { applyColor, isSolved, startRegion } from './flood'

function board(size: number, rows: string): Board {
  return { size, cells: [...rows.replace(/\s/g, '')].map(Number) }
}

describe('neighbors', () => {
  it('has no wrap-around', () => {
    expect(neighbors(3, 0).sort()).toEqual([1, 3])
    expect(neighbors(3, 4).sort()).toEqual([1, 3, 5, 7])
    expect(neighbors(3, 8).sort()).toEqual([5, 7])
    expect(neighbors(3, 2).sort()).toEqual([1, 5])
  })
})

describe('startRegion', () => {
  it('collects the connected cells of the top-left color', () => {
    const b = board(3, '001 011 222')
    expect(startRegion(b).sort()).toEqual([0, 1, 3])
  })

  it('does not include diagonal cells', () => {
    expect(startRegion(board(2, '01 10')).sort()).toEqual([0])
  })
})

describe('applyColor', () => {
  it('swallows adjacent cells of the new color', () => {
    const b = board(3, '001 011 222')
    expect(applyColor(b, 1).cells).toEqual(board(3, '111 111 222').cells)
  })

  it('makes the new region include connected cells of the new color', () => {
    const next = applyColor(board(3, '011 211 222'), 2)
    expect(next.cells).toEqual(board(3, '211 211 222').cells)
    expect(startRegion(next).sort()).toEqual([0, 3, 6, 7, 8])
  })

  it('changes nothing when the region color is applied', () => {
    const b = board(3, '001 011 222')
    expect(applyColor(b, 0)).toEqual(b)
  })

  it('does not mutate the input board', () => {
    const b = board(3, '001 011 222')
    const copy = structuredClone(b)
    applyColor(b, 1)
    expect(b).toEqual(copy)
  })
})

describe('isSolved', () => {
  it('is true only for a single-color board', () => {
    expect(isSolved(board(2, '11 11'))).toBe(true)
    expect(isSolved(board(2, '11 12'))).toBe(false)
  })
})

describe('levelParams', () => {
  it('matches the documented levels', () => {
    expect(levelParams).toEqual({
      a: { size: 6, colors: 4, minPar: 5, basePoints: 500 },
      b: { size: 10, colors: 5, minPar: 12, basePoints: 750 },
      c: { size: 14, colors: 6, minPar: 20, basePoints: 1000 },
    })
  })
})
