import { describe, expect, it } from 'vitest'
import { formatScore } from './format-score'

describe('formatScore', () => {
  it('shows points and on par for deviation 0', () => {
    expect(formatScore([500, 0])).toBe('500 points · On par')
  })

  it('shows under par with plural', () => {
    expect(formatScore([570, -1])).toBe('570 points · 1 move under par')
    expect(formatScore([620, -2])).toBe('620 points · 2 moves under par')
  })

  it('shows over par with plural', () => {
    expect(formatScore([470, 1])).toBe('470 points · 1 move over par')
    expect(formatScore([360, 3])).toBe('360 points · 3 moves over par')
  })
})
