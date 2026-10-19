import { expect, it } from 'vitest'
import { gameTexts } from './game-texts'

it('contains the spill-it texts', () => {
  const texts = gameTexts['spill-it']
  expect(texts?.name).toBe('Spillit')
  expect(texts?.challengeName('a')).toBe('6×6 · 4 colors')
  expect(texts?.challengeName('c')).toBe('14×14 · 6 colors')
})
