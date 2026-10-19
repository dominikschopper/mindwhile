import { computed, shallowRef } from 'vue'
import type { SpillItRound } from './round'

export function useSpillItRound(round: SpillItRound) {
  // The round is a plain object, this counter makes its state observable.
  const version = shallowRef(0)

  const cells = computed<readonly number[]>(() => {
    void version.value
    return [...round.board.cells]
  })
  const moveCount = computed(() => {
    void version.value
    return round.moves.length
  })
  const result = computed(() => {
    void version.value
    return round.result()
  })
  const solved = computed(() => result.value !== null)
  const regionColor = computed(() => cells.value[0]!)
  const regionSize = computed(() => {
    const { size } = round
    const region = cells.value
    const color = region[0]
    // Flood from cell 0 over same-colored neighbors.
    const seen = new Set<number>([0])
    const queue = [0]
    while (queue.length > 0) {
      const index = queue.pop()!
      const row = Math.floor(index / size)
      const column = index % size
      const next: number[] = []
      if (row > 0) next.push(index - size)
      if (row < size - 1) next.push(index + size)
      if (column > 0) next.push(index - 1)
      if (column < size - 1) next.push(index + 1)
      for (const n of next) {
        if (!seen.has(n) && region[n] === color) {
          seen.add(n)
          queue.push(n)
        }
      }
    }
    return seen.size
  })

  function pick(color: number): void {
    if (solved.value || color === regionColor.value) return
    round.apply({ type: 'pick', color })
    version.value++
  }

  return {
    cells,
    size: round.size,
    colorCount: round.colors,
    moveCount,
    par: round.par,
    regionColor,
    regionSize,
    result,
    solved,
    pick,
  }
}
