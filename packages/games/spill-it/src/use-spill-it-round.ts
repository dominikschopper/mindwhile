import { computed, shallowRef } from 'vue'
import { startRegion } from './flood'
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
  const regionColor = computed(() => {
    void version.value
    return round.board.cells[0]!
  })
  const regionSize = computed(() => {
    void version.value
    return startRegion(round.board).length
  })

  // The round ignores moves with the region color and moves after the solution.
  function pick(color: number): void {
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
