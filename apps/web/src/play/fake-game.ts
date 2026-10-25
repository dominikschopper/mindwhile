// Test-only: a tiny fake game so platform flow tests do not depend on a real game.
import type { GameManifest, GameModule, GameTexts, Round, RoundResult } from '@mindwhile/core'
import { h } from 'vue'
import type { Component } from 'vue'
import type { GameEntry, GameRegistry } from '../common/composables/game-registry'

export const fakeManifest: GameManifest = {
  id: 'fake',
  symbol: 'grid-2x2',
  gameVersion: 1,
  scoringVersion: 1,
  interfaceVersion: 1,
  challenges: ['a'],
  scoring: [{ key: 'points', better: 'higher' }],
}

export const fakeTexts: GameTexts = {
  name: 'Fake',
  challengeName: (challenge) => `Fake ${challenge}`,
  formatScore: (score) => `${score[0]} fake points`,
}

export interface FakeRound extends Round {
  seed: number
}

export interface FakeGame {
  entry: GameEntry
  registry: GameRegistry
  /** Every round created so far, oldest first. */
  rounds: FakeRound[]
}

export function createFakeGame(
  options: {
    failCreateRound?: boolean
    /** Fail only the first N attempts to create a round. */
    failFirstRounds?: number
    failLoad?: boolean
    throwInView?: boolean
  } = {},
): FakeGame {
  const rounds: FakeRound[] = []
  let attempts = 0

  function createRound(p: { challenge: string; seed: number }): FakeRound {
    attempts++
    if (options.failCreateRound || attempts <= (options.failFirstRounds ?? 0)) {
      throw new Error('createRound failed')
    }
    let result: RoundResult | null = null
    const round: FakeRound = {
      seed: p.seed,
      apply(move) {
        if ((move as { type?: string }).type === 'win')
          result = { roundEnd: 'won', score: [100, 0] }
      },
      serialize: () => ({ seed: p.seed }),
      result: () => result,
    }
    rounds.push(round)
    return round
  }

  const View: Component = (props: { round: Round }) => {
    if (options.throwInView) throw new Error('view failed')
    return h(
      'button',
      { type: 'button', class: 'fake-win', onClick: () => props.round.apply({ type: 'win' }) },
      'win',
    )
  }
  View.props = ['round']
  const HowToPlay: Component = () => h('p', 'How to play fake')

  const gameModule: GameModule<Component> = { manifest: fakeManifest, createRound, View, HowToPlay }
  const entry: GameEntry = {
    id: 'fake',
    manifest: fakeManifest,
    texts: fakeTexts,
    loadModule: async () => {
      if (options.failLoad) throw new Error('module load failed')
      return gameModule
    },
  }
  const registry: GameRegistry = {
    listGames: () => [entry],
    getGame: (id) => (id === 'fake' ? entry : undefined),
  }
  return { entry, registry, rounds }
}
