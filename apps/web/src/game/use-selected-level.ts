import { ref } from 'vue'
import type { Ref } from 'vue'

const selected = new Map<string, Ref<string>>()

export function useSelectedLevel(gameId: string, levels: readonly string[]): Ref<string> {
  let entry = selected.get(gameId)
  if (!entry) {
    entry = ref(levels[0] ?? '')
    selected.set(gameId, entry)
  }
  return entry
}
