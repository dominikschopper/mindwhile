export const roundEnds = ['won', 'lost', 'ended'] as const

export type RoundEnd = (typeof roundEnds)[number]

export interface RoundResult {
  roundEnd: RoundEnd
  score: number[]
}

export interface Round {
  apply(move: unknown): void
  serialize(): unknown
  result(): RoundResult | null
}

export type ScoreDirection = 'higher' | 'lower'

export interface ScorePosition {
  key: string
  better: ScoreDirection
}

export interface GameManifest {
  id: string
  gameVersion: number
  scoringVersion: number
  interfaceVersion: number
  challenges: readonly string[]
  scoring: readonly ScorePosition[]
}

export interface GameModule<TView = unknown> {
  manifest: GameManifest
  createRound(p: { challenge: string; seed: number; saved?: unknown }): Round
  View: TView
  views?: Record<string, () => Promise<TView>>
  HowToPlay: TView
}
