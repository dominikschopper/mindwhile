import { describe, expect, it } from 'vitest'
import type { GameManifest, GameModule, Round } from './contract'
import { playMoves } from './scoring-test'

function fakeRound(): Round & { applied: unknown[] } {
  const applied: unknown[] = []
  return {
    applied,
    apply(move) {
      applied.push(move)
    },
    serialize: () => ({ applied }),
    result: () => (applied.length >= 2 ? { roundEnd: 'won', score: [applied.length] } : null),
  }
}

describe('playMoves', () => {
  it('applies the moves in order and returns the final result', () => {
    const round = fakeRound()
    expect(playMoves(round, ['a', 'b'])).toEqual({ roundEnd: 'won', score: [2] })
    expect(round.applied).toEqual(['a', 'b'])
  })

  it('returns the current result for an empty move list', () => {
    expect(playMoves(fakeRound(), [])).toBeNull()
  })
})

describe('contract types', () => {
  it('accept plain objects', () => {
    const manifest = {
      id: 'x',
      symbol: 'x',
      gameVersion: 1,
      scoringVersion: 0,
      interfaceVersion: 1,
      levels: ['a'],
      scoring: [{ key: 'k', better: 'lower' }],
    } satisfies GameManifest
    const module: GameModule<string> = {
      manifest,
      createRound: () => fakeRound(),
      View: 'view',
      HowToPlay: 'help',
    }
    expect(module.manifest.id).toBe('x')
  })
})
