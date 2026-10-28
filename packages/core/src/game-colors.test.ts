import { describe, expect, it } from 'vitest'
import { gameColors } from './game-colors'

describe('gameColors', () => {
  it('lists the five game color names', () => {
    expect([...gameColors]).toEqual(['blue', 'green', 'orange', 'red', 'yellow'])
  })

  it('has only unique lowercase names', () => {
    expect(new Set(gameColors).size).toBe(gameColors.length)
    for (const name of gameColors) {
      expect(name).toMatch(/^[a-z]+$/)
    }
  })
})
