import { describe, expect, it } from 'vitest';
import { canPour } from '../../common/board/board';
import { createRound } from '../../round/round';
import { useJellySortRound } from './use-jelly-sort-round';

function setup(level = 'a', seed = 3) {
  const round = createRound({ level, seed });
  return { round, view: useJellySortRound(round) };
}

function findPour(round: ReturnType<typeof createRound>, valid: boolean): [number, number] {
  const n = round.board.trays.length;
  for (let from = 0; from < n; from++) {
    for (let to = 0; to < n; to++) {
      if (
        from !== to &&
        round.board.trays[from]!.length > 0 &&
        canPour(round.board, from, to) === valid
      ) {
        return [from, to];
      }
    }
  }
  throw new Error('no pour found');
}

describe('useJellySortRound', () => {
  it('exposes board, capacity, par and a zero move count', () => {
    const { round, view } = setup();
    expect(view.trays.value).toEqual(round.board.trays);
    expect(view.capacity).toBe(round.board.capacity);
    expect(view.par).toBe(round.par);
    expect(view.moveCount.value).toBe(0);
    expect(view.selected.value).toBeNull();
  });

  it('ignores a tap on an empty tray when nothing is selected', () => {
    const { round, view } = setup();
    const empty = round.board.trays.findIndex((tray) => tray.length === 0);
    view.tap(empty);
    expect(view.selected.value).toBeNull();
    expect(view.feedback.value).toBeNull();
  });

  it('selects a non-empty tray and cancels on the second tap', () => {
    const { view } = setup();
    view.tap(0);
    expect(view.selected.value).toBe(0);
    expect(view.feedback.value).toEqual({ kind: 'selected', tray: 0 });
    view.tap(0);
    expect(view.selected.value).toBeNull();
    expect(view.feedback.value).toEqual({ kind: 'cancelled' });
    expect(view.moveCount.value).toBe(0);
  });

  it('pours on a valid target and clears the selection', () => {
    const { round, view } = setup();
    const [from, to] = findPour(round, true);
    view.tap(from);
    view.tap(to);
    expect(view.moveCount.value).toBe(1);
    expect(round.moves).toEqual([[from, to]]);
    expect(view.selected.value).toBeNull();
    expect(view.feedback.value).toEqual({ kind: 'poured', from, to });
    expect(view.trays.value).toEqual(round.board.trays);
  });

  it('keeps the selection on an invalid target and counts nothing', () => {
    const { round, view } = setup();
    const [from, to] = findPour(round, false);
    const before = round.board;
    view.tap(from);
    view.tap(to);
    expect(view.selected.value).toBe(from);
    expect(view.moveCount.value).toBe(0);
    expect(round.board).toBe(before);
    expect(view.feedback.value).toEqual({ kind: 'invalid', from, to });
  });

  it.each(['won', 'lost'] as const)('ignores taps once the round is %s', (roundEnd) => {
    const real = createRound({ level: 'a', seed: 3 });
    const ended = { ...real, result: () => ({ roundEnd, score: [0, 0] as [number, number] }) };
    const view = useJellySortRound(ended);
    view.tap(0);
    expect(view.selected.value).toBeNull();
    expect(view.result.value?.roundEnd).toBe(roundEnd);
  });
});
