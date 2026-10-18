export const coreName = 'core' as const

export { roundEnds } from './contract'
export type {
  GameManifest,
  GameModule,
  Round,
  RoundEnd,
  RoundResult,
  ScoreDirection,
  ScorePosition,
} from './contract'
export { createRng, nextBelow } from './rng'
export type { Rng } from './rng'
export { playMoves } from './scoring-test'
