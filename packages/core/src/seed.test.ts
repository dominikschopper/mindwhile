import { afterEach, describe, expect, it, vi } from 'vitest'
import { newSeed } from './seed'

describe('newSeed', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns an unsigned 32-bit integer', () => {
    for (let i = 0; i < 100; i++) {
      const seed = newSeed()
      expect(Number.isInteger(seed)).toBe(true)
      expect(seed).toBeGreaterThanOrEqual(0)
      expect(seed).toBeLessThanOrEqual(4294967295)
    }
  })

  it('returns the value from crypto.getRandomValues', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: <T extends Uint32Array>(array: T): T => {
        array[0] = 123456789
        return array
      },
    })
    expect(newSeed()).toBe(123456789)
  })

  it('does not return the same value in 100 real calls', () => {
    const seeds = new Set<number>()
    for (let i = 0; i < 100; i++) seeds.add(newSeed())
    expect(seeds.size).toBeGreaterThan(1)
  })
})
