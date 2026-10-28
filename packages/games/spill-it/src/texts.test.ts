import { describe, expect, it } from 'vitest'
import { gameTexts, t } from './texts'

describe('gameTexts', () => {
  it('has the game name', () => {
    expect(gameTexts.name).toBe('Spill It!')
  })

  it('names the three levels', () => {
    expect(gameTexts.levelName('a')).toBe('6×6 · 4 colors')
    expect(gameTexts.levelName('b')).toBe('10×10 · 5 colors')
    expect(gameTexts.levelName('c')).toBe('14×14 · 6 colors')
  })

  it('formats a score with points and deviation from par', () => {
    expect(gameTexts.formatScore([500, 0])).toBe('500 points · On par')
    expect(gameTexts.formatScore([570, -1])).toBe('570 points · 1 move under par')
    expect(gameTexts.formatScore([470, 2])).toBe('470 points · 2 moves over par')
  })

  it('throws for an unknown level', () => {
    expect(() => gameTexts.levelName('z')).toThrow()
  })
})

describe('t types', () => {
  it('rejects unknown keys', () => {
    // @ts-expect-error unknown key
    t('no.such.key')
  })
})
