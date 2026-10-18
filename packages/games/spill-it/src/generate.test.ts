import { createRng, nextBelow } from '@mindwhile/core'
import { describe, expect, it } from 'vitest'
import { challengeParams } from './challenges'
import { generateBoard } from './generate'
import type { SpillItChallenge } from './manifest'
import { greedyPar } from './par'

const challenges: SpillItChallenge[] = ['a', 'b', 'c']

function drawFirstBoard(challenge: SpillItChallenge, seed: number) {
  const { size, colors } = challengeParams[challenge]
  const rng = createRng(seed)
  return { size, cells: Array.from({ length: size * size }, () => nextBelow(rng, colors)) }
}

describe('generateBoard', () => {
  it.each(challenges)('is deterministic for challenge %s', (challenge) => {
    expect(generateBoard(challenge, 123)).toEqual(generateBoard(challenge, 123))
  })

  it('usually differs for different seeds', () => {
    expect(generateBoard('a', 1).board).not.toEqual(generateBoard('a', 2).board)
  })

  it.each(challenges)('accepts only boards with par >= minPar (challenge %s)', (challenge) => {
    const { colors, minPar } = challengeParams[challenge]
    for (let seed = 0; seed < 50; seed++) {
      const { board, par } = generateBoard(challenge, seed)
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
    // challenge c with minPar 20 rejects some first draws, find one
    let seed = 0
    const params = challengeParams.c
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
    const params = challengeParams.c
    while (greedyPar(drawFirstBoard('c', seed), params.colors) >= params.minPar) seed++
    expect(() => generateBoard('c', seed, 1)).toThrow(/after 1 draws/)
  })

  it('generates a 14x14 board with par in reasonable time', () => {
    const start = performance.now()
    generateBoard('c', 7)
    expect(performance.now() - start).toBeLessThan(500)
  })
})
