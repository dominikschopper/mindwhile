import { ref } from 'vue'
import type { Ref } from 'vue'

const selected = new Map<string, Ref<string>>()

export function useSelectedChallenge(gameId: string, challenges: readonly string[]): Ref<string> {
  let entry = selected.get(gameId)
  if (!entry) {
    entry = ref(challenges[0] ?? '')
    selected.set(gameId, entry)
  }
  return entry
}
