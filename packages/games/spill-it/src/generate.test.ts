import { createRng, nextBelow } from '@mindwhile/core'
import { describe, expect, it } from 'vitest'
import { levelParams } from './levels'
import { generateBoard } from './generate'
import type { SpillItLevel } from './manifest'
import { greedyPar } from './par'

const levels: SpillItLevel[] = ['a', 'b', 'c']

function drawFirstBoard(level: SpillItLevel, seed: number) {
  const { size, colors } = levelParams[level]
  const rng = createRng(seed)
  return { size, cells: Array.from({ length: size * size }, () => nextBelow(rng, colors)) }
}

describe('generateBoard', () => {
  it.each(levels)('is deterministic for level %s', (level) => {
    expect(generateBoard(level, 123)).toEqual(generateBoard(level, 123))
  })

  it('usually differs for different seeds', () => {
    expect(generateBoard('a', 1).board).not.toEqual(generateBoard('a', 2).board)
  })

  it.each(levels)('accepts only boards with par >= minPar (level %s)', (level) => {
    const { colors, minPar } = levelParams[level]
    for (let seed = 0; seed < 50; seed++) {
      const { board, par } = generateBoard(level, seed)
      expect(par).toBeGreaterThanOrEqual(minPar)
      expect(par).toBe(greedyPar(board, colors))
      expect(board.cells).toHaveLength(board.size * board.size)
    }
  })

  it('works for the seed limits', () => {
    expect(() => generateBoard('a', 0)).not.toThrow()
    expect(() => generateBoard('a', 4294967295)).not.toThrow()
  })

  it('redraws from the same stream when the first board is too easy', () => {
    // level c with minPar 20 rejects some first draws, find one
    let seed = 0
    const params = levelParams.c
    while (greedyPar(drawFirstBoard('c', seed), params.colors) >= params.minPar) seed++
    const first = drawFirstBoard('c', seed)
    const { board } = generateBoard('c', seed)
    expect(board.cells).not.toEqual(first.cells)
    // the accepted board is a later draw of the stream: replay the stream manually
    const rng = createRng(seed)
    let manual = first
    let draws = 1
    for (let i = 0; i < first.cells.length; i++) nextBelow(rng, params.colors)
    while (greedyPar(manual, params.colors) < params.minPar) {
      manual = {
        size: params.size,
        cells: Array.from({ length: params.size ** 2 }, () => nextBelow(rng, params.colors)),
      }
      draws++
    }
    expect(draws).toBeGreaterThan(1)
    expect(board.cells).toEqual(manual.cells)
  })

  it('throws when no board is accepted within the limit', () => {
    let seed = 0
    const params = levelParams.c
    while (greedyPar(drawFirstBoard('c', seed), params.colors) >= params.minPar) seed++
    expect(() => generateBoard('c', seed, 1)).toThrow(/after 1 draws/)
  })

  it('generates a 14x14 board with par in reasonable time', () => {
    const start = performance.now()
    generateBoard('c', 7)
    expect(performance.now() - start).toBeLessThan(500)
  })
})
