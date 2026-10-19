import { describe, expect, it } from 'vitest'
import { challengeParams } from './challenges'
import { pointsFor } from './points'

describe('pointsFor', () => {
  it.each(['a', 'b', 'c'] as const)('gives the base value on par (challenge %s)', (challenge) => {
    expect(pointsFor(challenge, 9, 9)).toBe(challengeParams[challenge].basePoints)
  })

  it('gives more points for fewer moves and fewer for more moves', () => {
    expect(pointsFor('a', 7, 8)).toBe(570)
    expect(pointsFor('a', 8, 8)).toBe(500)
    expect(pointsFor('a', 10, 8)).toBe(400)
    expect(pointsFor('a', 7, 8)).toBeGreaterThan(pointsFor('a', 8, 8))
    expect(pointsFor('a', 8, 8)).toBeGreaterThan(pointsFor('a', 9, 8))
  })

  it('rounds down to steps of ten', () => {
    // 750 * 17 / 15 = 850
    expect(pointsFor('b', 15, 17)).toBe(850)
    // 1000 * 26 / 27 = 962.96 -> 960
    expect(pointsFor('c', 27, 26)).toBe(960)
    for (let moves = 1; moves < 80; moves++) {
      expect(pointsFor('c', moves, 26) % 10).toBe(0)
    }
  })

  it('never gets negative and reaches 0 for huge move counts', () => {
    expect(pointsFor('a', 100000, 8)).toBe(0)
    expect(pointsFor('a', 200, 5)).toBeGreaterThanOrEqual(0)
  })

  it('rejects zero or invalid move counts', () => {
    expect(() => pointsFor('a', 0, 8)).toThrow(RangeError)
    expect(() => pointsFor('a', 1.5, 8)).toThrow(RangeError)
  })
})
