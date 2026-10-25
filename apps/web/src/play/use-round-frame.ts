import type { Round, RoundResult } from '@mindwhile/core'
import { shallowRef } from 'vue'

// PROVISIONAL: stand-in for the platform round frame (saving, abort, best result).
// It is replaced by the platform plan. It only detects the end of a round.
export function useRoundFrame<T extends Round>(round: T) {
  const result = shallowRef<RoundResult | null>(null)

  // Object.create keeps the read-only extras of the game round (board, moves, ...)
  // working, because they are getters on the prototype closing over the real state.
  const framed: T = Object.create(round, {
    apply: {
      value(move: unknown): void {
        round.apply(move)
        result.value = round.result()
      },
    },
  })

  return { round: framed, result }
}
