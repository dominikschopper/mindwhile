import { describe, expect, it } from 'vitest'
import { createRng, nextBelow } from './rng'

// Pinned with the reference mulberry32 implementation, not with this code.
const pinned: [number, number[]][] = [
  [0, [1144304738, 1416247, 958946056, 627933444, 2007157716]],
  [1, [2693262067, 11749833, 2265367787, 4213581821, 4159151403]],
  [4294967295, [3850105811, 813802916, 3073704848, 4054706436, 3630262831]],
]

describe('createRng', () => {
  it.each(pinned)('matches the reference sequence for seed %i', (seed, expected) => {
    const rng = createRng(seed)
    expect(expected.map(() => rng.next())).toEqual(expected)
  })

  it('gives the same sequence for the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(
      Array.from({ length: 20 }, () => b.next()),
    )
  })

  it('differs for different seeds', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next())
  })

  it.each([-1, 1.5, 4294967296, Number.NaN])('rejects seed %s', (seed) => {
    expect(() => createRng(seed)).toThrow(RangeError)
  })
})

describe('nextBelow', () => {
  it('stays below the bound', () => {
    const rng = createRng(7)
    for (let i = 0; i < 1000; i++) {
      const value = nextBelow(rng, 6)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(6)
    }
  })

  it.each([0, -1, 1.5])('rejects bound %s', (bound) => {
    expect(() => nextBelow(createRng(1), bound)).toThrow(RangeError)
  })
})
