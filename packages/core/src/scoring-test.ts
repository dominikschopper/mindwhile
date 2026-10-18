import type { Round, RoundResult } from './contract'

// Helper for the scoring tests of a game. Free of any test framework, the tests assert.
export function playMoves(round: Round, moves: readonly unknown[]): RoundResult | null {
  for (const move of moves) {
    round.apply(move)
  }
  return round.result()
}
