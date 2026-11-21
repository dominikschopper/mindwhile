import { computed, shallowRef } from 'vue';
import { canPour } from '../../common/board/board';
import type { JellySortRound } from '../../round/round';

// What the last tap did, for the live region. Tray numbers are 0-based.
export type TapFeedback =
  | { kind: 'selected'; tray: number }
  | { kind: 'cancelled' }
  | { kind: 'invalid'; from: number; to: number }
  | { kind: 'poured'; from: number; to: number };

export function useJellySortRound(round: JellySortRound) {
  // The round is a plain object, this counter makes its state observable.
  const version = shallowRef(0);

  const trays = computed<readonly (readonly number[])[]>(() => {
    void version.value;
    return round.board.trays;
  });
  const moveCount = computed(() => {
    void version.value;
    return round.moves.length;
  });
  const result = computed(() => {
    void version.value;
    return round.result();
  });
  const selected = shallowRef<number | null>(null);
  const feedback = shallowRef<TapFeedback | null>(null);

  function tap(index: number): void {
    if (result.value !== null || index < 0 || index >= round.board.trays.length) {
      return;
    }
    const from = selected.value;
    if (from === null) {
      if (round.board.trays[index]!.length > 0) {
        selected.value = index;
        feedback.value = { kind: 'selected', tray: index };
      }
      return;
    }
    if (from === index) {
      selected.value = null;
      feedback.value = { kind: 'cancelled' };
      return;
    }
    if (!canPour(round.board, from, index)) {
      feedback.value = { kind: 'invalid', from, to: index };
      return;
    }
    round.apply({ type: 'pour', from, to: index });
    version.value++;
    selected.value = null;
    feedback.value = { kind: 'poured', from, to: index };
  }

  return {
    trays,
    capacity: round.board.capacity,
    moveCount,
    par: round.par,
    selected,
    feedback,
    result,
    tap,
  };
}
