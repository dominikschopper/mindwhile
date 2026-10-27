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
  /** Icon name from the list offered by game-kit, the platform maps it to a component. */
  symbol: string
  gameVersion: number
  scoringVersion: number
  interfaceVersion: number
  levels: readonly string[]
  scoring: readonly ScorePosition[]
}

export interface GameModule<TView = unknown> {
  manifest: GameManifest
  createRound(p: { level: string; seed: number; saved?: unknown }): Round
  View: TView
  views?: Record<string, () => Promise<TView>>
  HowToPlay: TView
}

export interface GameTexts {
  name: string
  levelName(level: string): string
  // Score is the game's own score vector, returned as one display line.
  formatScore(score: readonly number[]): string
}
