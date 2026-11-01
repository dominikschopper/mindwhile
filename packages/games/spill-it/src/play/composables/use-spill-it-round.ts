import { computed, shallowRef } from 'vue';
import { startRegion } from '../../common/board/flood';
import type { SpillItRound } from '../../round/round';

export function useSpillItRound(round: SpillItRound) {
  // The round is a plain object, this counter makes its state observable.
  const version = shallowRef(0);

  const cells = computed<readonly number[]>(() => {
    void version.value;
    return [...round.board.cells];
  });
  const moveCount = computed(() => {
    void version.value;
    return round.moves.length;
  });
  const result = computed(() => {
    void version.value;
    return round.result();
  });
  const solved = computed(() => result.value !== null);
  const regionColor = computed(() => {
    void version.value;
    return round.board.cells[0]!;
  });
  const regionSize = computed(() => {
    void version.value;
    return startRegion(round.board).length;
  });

  // The last move the round accepted: its color and the move count after it.
  const lastPickState = shallowRef<{ color: number; tick: number } | null>(null);
  const lastPick = computed(() => {
    void version.value;
    return lastPickState.value;
  });

  // The round ignores moves with the region color and moves after the solution.
  function pick(color: number): void {
    const before = round.moves.length;
    round.apply({ type: 'pick', color });
    if (round.moves.length !== before) {
      lastPickState.value = { color, tick: round.moves.length };
    }
    version.value++;
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
    lastPick,
    pick,
  };
}
