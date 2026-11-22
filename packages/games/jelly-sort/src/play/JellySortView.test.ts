// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { canPour, pour, topBlock } from '../common/board/board';
import { wobbleFor } from './wobble';
import { createRound, type JellySortRound } from '../round/round';
import { LANDING_TIMING, describePour } from './animation';
import JellySortView from './JellySortView.vue';

function setup(round: JellySortRound = createRound({ level: 'a', seed: 3 })) {
  const wrapper = mount(JellySortView, { props: { round }, attachTo: document.body });
  return { round, wrapper };
}

// A round that shows the given trays, for tests that need an exact board.
function withBoard(trays: number[][]): JellySortRound {
  const round = createRound({ level: 'a', seed: 3 });
  return { ...round, board: { capacity: 4, trays } } as JellySortRound;
}

function key(k: string, init: KeyboardEventInit = {}, target: EventTarget = window) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...init }));
}

function findPour(round: JellySortRound, valid: boolean): [number, number] {
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

describe('JellySortView', () => {
  it('shows moves and par from the start', () => {
    const { round, wrapper } = setup();
    expect(wrapper.text()).toContain('Moves 0');
    expect(wrapper.text()).toContain(`Par ${round.par}`);
    wrapper.unmount();
  });

  it('renders one button per tray with a label of position and contents', () => {
    const { round, wrapper } = setup();
    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(round.board.trays.length);
    const first = round.board.trays[0]!;
    const label = buttons[0]!.attributes('aria-label')!;
    expect(label).toContain(`Tray 1, ${first.length} of ${round.board.capacity} filled: `);
    expect(label.split(': ')[1]!.split(', ')).toHaveLength(first.length);
    wrapper.unmount();
  });

  it('labels an empty tray', () => {
    const { wrapper } = setup(withBoard([[0, 1], []]));
    expect(wrapper.findAll('button')[1]!.attributes('aria-label')).toBe('Tray 2, empty');
    wrapper.unmount();
  });

  it('names layers from bottom to top with color and mark', () => {
    const { wrapper } = setup(withBoard([[0, 3, 1], [], []]));
    expect(wrapper.findAll('button')[0]!.attributes('aria-label')).toBe(
      'Tray 1, 3 of 4 filled: orange infinity, yellow plane, sky blue alert',
    );
    wrapper.unmount();
  });

  it('selects, announces, and pours through the real round', async () => {
    const { round, wrapper } = setup();
    const [from, to] = findPour(round, true);
    const buttons = wrapper.findAll('button');
    await buttons[from]!.trigger('click');
    expect(buttons[from]!.attributes('aria-pressed')).toBe('true');
    expect(wrapper.find('[aria-live="polite"]').text()).toBe(`Tray ${from + 1} selected`);
    await buttons[to]!.trigger('click');
    expect(round.moves).toEqual([[from, to]]);
    expect(wrapper.text()).toContain('Moves 1');
    expect(wrapper.findAll('button')[from]!.attributes('aria-pressed')).toBe('false');
    expect(wrapper.find('[aria-live="polite"]').text()).toBe(
      `Poured tray ${from + 1} into tray ${to + 1}. Moves 1`,
    );
    wrapper.unmount();
  });

  it('cancels by tapping the same tray', async () => {
    const { round, wrapper } = setup();
    const button = wrapper.findAll('button')[0]!;
    await button.trigger('click');
    await button.trigger('click');
    expect(button.attributes('aria-pressed')).toBe('false');
    expect(wrapper.find('[aria-live="polite"]').text()).toBe('Selection cancelled');
    expect(round.moves).toHaveLength(0);
    wrapper.unmount();
  });

  it('keeps the selection on an invalid target', async () => {
    const { round, wrapper } = setup();
    const [from, to] = findPour(round, false);
    const buttons = wrapper.findAll('button');
    await buttons[from]!.trigger('click');
    await buttons[to]!.trigger('click');
    expect(buttons[from]!.attributes('aria-pressed')).toBe('true');
    expect(round.moves).toHaveLength(0);
    expect(wrapper.text()).toContain('Moves 0');
    expect(wrapper.find('[aria-live="polite"]').text()).toBe(
      `Cannot pour tray ${from + 1} into tray ${to + 1}`,
    );
    wrapper.unmount();
  });

  it('does nothing when an empty tray is tapped with nothing selected', async () => {
    const { wrapper } = setup(withBoard([[0, 1], []]));
    await wrapper.findAll('button')[1]!.trigger('click');
    expect(wrapper.findAll('[aria-pressed="true"]')).toHaveLength(0);
    expect(wrapper.find('[aria-live="polite"]').text()).toBe('');
    wrapper.unmount();
  });

  it('plays with the keyboard: digit, arrows, Enter', async () => {
    const { round, wrapper } = setup();
    const [from, to] = findPour(round, true);
    // Jump to the source tray, select it with Enter, move to the target with arrows.
    key('1');
    key('ArrowRight', {}, window);
    key('1');
    for (let i = 0; i < from; i++) {
      key('ArrowRight');
    }
    key('Enter');
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('button')[from]!.attributes('aria-pressed')).toBe('true');
    for (let i = from; i < to; i++) {
      key('ArrowRight');
    }
    for (let i = from; i > to; i--) {
      key('ArrowLeft');
    }
    key(' ');
    await wrapper.vm.$nextTick();
    expect(round.moves).toEqual([[from, to]]);
    wrapper.unmount();
  });

  it('jumps to a tray with a digit key', async () => {
    const { wrapper } = setup();
    key('3');
    key('Enter');
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('button')[2]!.attributes('aria-pressed')).toBe('true');
    wrapper.unmount();
  });

  it('ignores keys in form fields and with modifiers', async () => {
    const { wrapper } = setup();
    const input = document.createElement('input');
    document.body.appendChild(input);
    key('1', {}, input);
    key('1', { ctrlKey: true });
    key('Enter');
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('[aria-pressed="true"]')).toHaveLength(0);
    input.remove();
    wrapper.unmount();
  });

  it('stops listening after unmount', async () => {
    const { wrapper } = setup();
    wrapper.unmount();
    expect(() => key('1')).not.toThrow();
  });

  it.each([
    ['won', 'Solved in 0 moves'],
    ['lost', 'No moves left'],
  ] as const)('announces the %s end and stops reacting', async (roundEnd, text) => {
    const real = createRound({ level: 'a', seed: 3 });
    const { wrapper } = setup({
      ...real,
      result: () => ({ roundEnd, score: [0, 0] as [number, number] }),
    } as JellySortRound);
    expect(wrapper.find('[aria-live="polite"]').text()).toBe(text);
    await wrapper.findAll('button')[0]!.trigger('click');
    expect(wrapper.findAll('[aria-pressed="true"]')).toHaveLength(0);
    wrapper.unmount();
  });

  describe('motion', () => {
    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    const wobbling = (wrapper: ReturnType<typeof setup>['wrapper']) =>
      wrapper.findAll('.tray-glass__block--wobble');

    it('wobbles only after selection, survives an invalid tap, stops on cancel and pour', async () => {
      const { round, wrapper } = setup();
      expect(wobbling(wrapper)).toHaveLength(0);
      const [badFrom, badTo] = findPour(round, false);
      const buttons = wrapper.findAll('button');
      await buttons[badFrom]!.trigger('click');
      expect(wobbling(wrapper).length).toBeGreaterThan(0);
      expect(buttons[badFrom]!.findAll('.tray-glass__block--wobble').length).toBeGreaterThan(0);
      await buttons[badTo]!.trigger('click');
      expect(buttons[badFrom]!.findAll('.tray-glass__block--wobble').length).toBeGreaterThan(0);
      expect(wobbling(wrapper).length).toBe(
        buttons[badFrom]!.findAll('.tray-glass__block--wobble').length,
      );
      await buttons[badFrom]!.trigger('click');
      expect(wobbling(wrapper)).toHaveLength(0);
      const [from, to] = findPour(round, true);
      await buttons[from]!.trigger('click');
      expect(wobbling(wrapper).length).toBeGreaterThan(0);
      await buttons[to]!.trigger('click');
      expect(wobbling(wrapper)).toHaveLength(0);
      wrapper.unmount();
    });

    it('marks the landing in the target tray and clears it later', async () => {
      vi.useFakeTimers();
      const { round, wrapper } = setup();
      const [from, to] = findPour(round, true);
      const buttons = wrapper.findAll('button');
      await buttons[from]!.trigger('click');
      await buttons[to]!.trigger('click');
      expect(buttons[to]!.findAll('.tray-glass__layer--flow').length).toBeGreaterThan(0);
      expect(buttons[from]!.find('.tray-glass__layer--flow').exists()).toBe(false);
      vi.advanceTimersByTime(1000);
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.tray-glass__layer--flow').exists()).toBe(false);
      wrapper.unmount();
    });

    it('sets the merge class exactly when the poured color meets the same color', async () => {
      vi.useFakeTimers();
      let merges = 0;
      let plains = 0;
      for (let seed = 1; seed <= 40 && (merges === 0 || plains === 0); seed++) {
        const round = createRound({ level: 'a', seed });
        const [from, to] = findPour(round, true);
        const expected = describePour(round.board.trays[from]!, round.board.trays[to]!, 0).merged;
        const wrapper = mount(JellySortView, { props: { round }, attachTo: document.body });
        const buttons = wrapper.findAll('button');
        await buttons[from]!.trigger('click');
        await buttons[to]!.trigger('click');
        expect(buttons[to]!.find('.tray-glass__layer--flow').exists()).toBe(true);
        vi.advanceTimersByTime(LANDING_TIMING.flow);
        await wrapper.vm.$nextTick();
        expect(buttons[to]!.find('.tray-glass__block--hover-poured').exists()).toBe(expected);
        vi.advanceTimersByTime(LANDING_TIMING.hover);
        await wrapper.vm.$nextTick();
        expect(buttons[to]!.find('.tray-glass__layer--merge').exists()).toBe(expected);
        if (expected) {
          merges++;
        } else {
          plains++;
        }
        wrapper.unmount();
      }
      expect(plains).toBeGreaterThan(0);
    });

    it('sets no motion classes with reduced motion, the lifted cue stays', async () => {
      vi.stubGlobal('matchMedia', () => ({ matches: true }));
      const { round, wrapper } = setup();
      const [from, to] = findPour(round, true);
      const buttons = wrapper.findAll('button');
      await buttons[from]!.trigger('click');
      expect(wobbling(wrapper)).toHaveLength(0);
      expect(wrapper.find('.tray-glass__block--lifted').exists()).toBe(true);
      await buttons[to]!.trigger('click');
      expect(wrapper.find('.tray-glass__layer--flow').exists()).toBe(false);
      expect(wrapper.find('.tray-glass__layer--merge').exists()).toBe(false);
      wrapper.unmount();
    });

    // Finds a round with a valid pour of the given kind (onto the same color, or into an empty tray).
    function scenario(kind: 'same' | 'empty') {
      for (let seed = 1; seed <= 200; seed++) {
        const round = createRound({ level: 'a', seed });
        const trays = round.board.trays;
        for (let from = 0; from < trays.length; from++) {
          for (let to = 0; to < trays.length; to++) {
            if (from === to || trays[from]!.length === 0 || !canPour(round.board, from, to)) {
              continue;
            }
            const { merged } = describePour(trays[from]!, trays[to]!, 0);
            const empty = trays[to]!.length === 0;
            if ((kind === 'same' && merged) || (kind === 'empty' && empty)) {
              return { round, from, to };
            }
          }
        }
      }
      throw new Error('no scenario');
    }
    const phaseOf = (wrapper: ReturnType<typeof setup>['wrapper'], tray: number) =>
      wrapper.findAll('button')[tray]!.attributes('data-landing-phase');

    it('goes through flow, hover and merge in order and ends without landing state', async () => {
      vi.useFakeTimers();
      const { round, from, to } = scenario('same');
      const { wrapper } = setup(round);
      const buttons = wrapper.findAll('button');
      const moved =
        round.board.trays[from]!.length - pour(round.board, from, to).trays[from]!.length;
      const existing = topBlock(round.board.trays[to]!)!.length;
      expect(moved).toBeGreaterThan(0);
      await buttons[from]!.trigger('click');
      await buttons[to]!.trigger('click');
      expect(phaseOf(wrapper, to)).toBe('flow');
      expect(buttons[to]!.find('.tray-glass__block').exists()).toBe(false);
      vi.advanceTimersByTime(LANDING_TIMING.flow);
      await wrapper.vm.$nextTick();
      expect(phaseOf(wrapper, to)).toBe('hover');
      const existingBlock = buttons[to]!.find('.tray-glass__block--hover-existing');
      const pouredBlock = buttons[to]!.find('.tray-glass__block--hover-poured');
      expect(existingBlock.classes()).toContain('tray-glass__block--wobble');
      expect(pouredBlock.classes()).toContain('tray-glass__block--wobble');
      // Only the upper half of the existing block wobbles, each part with its own kind.
      const wobblingExisting = Math.ceil(existing / 2);
      expect(existingBlock.findAll('.tray-glass__layer')).toHaveLength(wobblingExisting);
      expect(existingBlock.attributes('data-wobble')).toBe(
        String(wobbleFor(wobblingExisting).kind),
      );
      expect(pouredBlock.findAll('.tray-glass__layer')).toHaveLength(moved);
      expect(pouredBlock.attributes('data-wobble')).toBe(String(wobbleFor(moved).kind));
      vi.advanceTimersByTime(LANDING_TIMING.hover);
      await wrapper.vm.$nextTick();
      expect(phaseOf(wrapper, to)).toBe('merge');
      expect(buttons[to]!.find('.tray-glass__block').exists()).toBe(false);
      expect(buttons[to]!.findAll('.tray-glass__layer--merge')).toHaveLength(moved);
      vi.advanceTimersByTime(LANDING_TIMING.merge);
      await wrapper.vm.$nextTick();
      expect(phaseOf(wrapper, to)).toBeUndefined();
      expect(wrapper.find('.tray-glass__layer--merge').exists()).toBe(false);
      expect(wrapper.find('.tray-glass__layer--settle').exists()).toBe(false);
      // The poured layers and the old top block are one run with square touching corners.
      const layers = buttons[to]!.findAll('.tray-glass__layer');
      const seam = layers.length - moved;
      expect(layers[seam - 1]!.classes()).toContain('tray-glass__layer--join-above');
      expect(layers[seam]!.classes()).toContain('tray-glass__layer--join-below');
      wrapper.unmount();
    });

    it('has no hover and no wobble when pouring into an empty tray', async () => {
      vi.useFakeTimers();
      const { round, from, to } = scenario('empty');
      const { wrapper } = setup(round);
      const buttons = wrapper.findAll('button');
      await buttons[from]!.trigger('click');
      await buttons[to]!.trigger('click');
      vi.advanceTimersByTime(LANDING_TIMING.flow - 1);
      await wrapper.vm.$nextTick();
      expect(phaseOf(wrapper, to)).toBe('flow');
      expect(wrapper.find('.tray-glass__block--wobble').exists()).toBe(false);
      vi.advanceTimersByTime(1);
      await wrapper.vm.$nextTick();
      expect(phaseOf(wrapper, to)).toBeUndefined();
      expect(vi.getTimerCount()).toBe(0);
      wrapper.unmount();
    });

    it('replaces a running landing with a new pour and drops the old timers', async () => {
      vi.useFakeTimers();
      const { round, from, to } = scenario('same');
      // A second pour that is valid after the first one, found on a copy of the board.
      const after = pour(round.board, from, to);
      let second: [number, number] | null = null;
      for (let a = 0; a < after.trays.length && !second; a++) {
        for (let b = 0; b < after.trays.length && !second; b++) {
          if (a !== b && after.trays[a]!.length > 0 && canPour(after, a, b) && b !== to) {
            second = [a, b];
          }
        }
      }
      if (!second) {
        throw new Error('no second pour');
      }
      const { wrapper } = setup(round);
      const buttons = wrapper.findAll('button');
      await buttons[from]!.trigger('click');
      await buttons[to]!.trigger('click');
      vi.advanceTimersByTime(LANDING_TIMING.flow);
      await wrapper.vm.$nextTick();
      expect(phaseOf(wrapper, to)).toBe('hover');
      await buttons[second[0]]!.trigger('click');
      await buttons[second[1]]!.trigger('click');
      expect(phaseOf(wrapper, to)).toBeUndefined();
      expect(phaseOf(wrapper, second[1])).toBe('flow');
      // The old landing would be in merge by now, the new one is still in its own phase.
      vi.advanceTimersByTime(LANDING_TIMING.hover);
      await wrapper.vm.$nextTick();
      expect(phaseOf(wrapper, to)).toBeUndefined();
      vi.advanceTimersByTime(LANDING_TIMING.merge + LANDING_TIMING.flow);
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-landing-phase]').exists()).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
      wrapper.unmount();
    });

    it('sets no landing with reduced motion, even for the same color', async () => {
      vi.stubGlobal('matchMedia', () => ({ matches: true }));
      const { round, from, to } = scenario('same');
      const { wrapper } = setup(round);
      const buttons = wrapper.findAll('button');
      await buttons[from]!.trigger('click');
      await buttons[to]!.trigger('click');
      expect(wrapper.find('[data-landing-phase]').exists()).toBe(false);
      expect(wrapper.find('.tray-glass__block--wobble').exists()).toBe(false);
      expect(wrapper.find('.tray-glass__layer--flow').exists()).toBe(false);
      wrapper.unmount();
    });

    it('cancels the pending landing timer on unmount', async () => {
      vi.useFakeTimers();
      const { round, wrapper } = setup();
      const [from, to] = findPour(round, true);
      const buttons = wrapper.findAll('button');
      await buttons[from]!.trigger('click');
      await buttons[to]!.trigger('click');
      expect(vi.getTimerCount()).toBeGreaterThan(0);
      wrapper.unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});

describe('JellySortView tray rows', () => {
  it('splits ten trays into 5 + 5 at a phone width', async () => {
    const trays = Array.from({ length: 10 }, (_, i) => [i % 4]);
    let report: (entries: unknown[]) => void = () => {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: (entries: unknown[]) => void) {
          report = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    const round = createRound({ level: 'a', seed: 3 });
    const wrapper = mount(JellySortView, {
      props: { round: { ...round, board: { capacity: 4, trays } } as JellySortRound },
    });
    report([{ contentRect: { width: 368 } }]);
    await wrapper.vm.$nextTick();
    const rows = wrapper.findAll('.jelly-sort-row');
    expect(rows.map((row) => row.findAll('button').length)).toEqual([5, 5]);
    wrapper.unmount();
    vi.unstubAllGlobals();
  });
});
