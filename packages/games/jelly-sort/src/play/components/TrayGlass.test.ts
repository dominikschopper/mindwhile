// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TrayGlass from './TrayGlass.vue';
import { topBlockStart } from './tray-glass';

function setup(props: Partial<InstanceType<typeof TrayGlass>['$props']> = {}) {
  return mount(TrayGlass, {
    props: { layers: [], capacity: 4, selected: false, label: 'Tray 1, empty', ...props },
    attachTo: document.body,
  });
}

describe('TrayGlass', () => {
  it('renders an empty glass without layers', () => {
    const wrapper = setup();
    expect(wrapper.findAll('.tray-glass__layer')).toHaveLength(0);
  });

  it('renders one layer per entry, bottom first, with color class and mark', () => {
    const wrapper = setup({ layers: [2, 0, 7] });
    const layers = wrapper.findAll('.tray-glass__layer');
    expect(layers).toHaveLength(3);
    expect(layers.map((layer) => layer.attributes('data-color'))).toEqual(['2', '0', '7']);
    expect(layers[0]!.classes()).toContain('jelly--2');
    expect(layers[1]!.classes()).toContain('jelly--0');
    expect(layers[2]!.classes()).toContain('jelly--7');
    for (const layer of layers) {
      expect(layer.find('svg').exists()).toBe(true);
    }
  });

  it('draws different marks for different colors', () => {
    const wrapper = setup({ layers: [0, 1] });
    const [first, second] = wrapper.findAll('.tray-glass__layer svg');
    expect(first!.html()).not.toBe(second!.html());
  });

  it('renders a full glass', () => {
    const wrapper = setup({ layers: [1, 1, 3, 3], capacity: 4 });
    expect(wrapper.findAll('.tray-glass__layer')).toHaveLength(4);
  });

  it('shows the lifted block only around the top block when selected', () => {
    const wrapper = setup({ layers: [1, 2, 2], selected: true });
    const block = wrapper.find('.tray-glass__block--lifted');
    expect(block.findAll('.tray-glass__layer')).toHaveLength(2);
    expect(wrapper.findAll('.tray-glass__layer')).toHaveLength(3);
    expect(wrapper.attributes('aria-pressed')).toBe('true');
  });

  it('shows no lifted block when not selected', () => {
    const wrapper = setup({ layers: [1, 2, 2] });
    expect(wrapper.find('.tray-glass__block').exists()).toBe(false);
    expect(wrapper.findAll('.tray-glass__layer')).toHaveLength(3);
    expect(wrapper.attributes('aria-pressed')).toBe('false');
  });

  it('emits select once per click', async () => {
    const wrapper = setup({ layers: [1] });
    await wrapper.trigger('click');
    expect(wrapper.emitted('select')).toHaveLength(1);
  });

  it('does not emit select when disabled', async () => {
    const wrapper = setup({ layers: [1], disabled: true });
    await wrapper.trigger('click');
    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('is a button with the given accessible label', () => {
    const wrapper = setup({ label: 'Tray 3, apple on top' });
    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.attributes('aria-label')).toBe('Tray 3, apple on top');
  });

  it('can take focus', () => {
    const wrapper = setup();
    (wrapper.element as HTMLButtonElement).focus();
    expect(document.activeElement).toBe(wrapper.element);
  });
});

describe('TrayGlass motion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    [[4, 1], '1', 1],
    [[4, 1, 1], '2', 2],
    [[4, 1, 1, 1], '3', 3],
    [[1, 1, 1, 1], '3', 4],
  ])('wraps the top block of %j in one wobbling unit of kind %s', (layers, kind, size) => {
    const wrapper = setup({ layers, selected: true });
    const blocks = wrapper.findAll('.tray-glass__block');
    expect(blocks).toHaveLength(1);
    const block = blocks[0]!;
    expect(block.attributes('data-wobble')).toBe(kind);
    expect(block.classes()).toContain(`tray-glass__block--wobble-${kind}`);
    expect(block.findAll('.tray-glass__layer')).toHaveLength(size);
    expect(wrapper.findAll('.tray-glass__layer')).toHaveLength(layers.length);
    // Layers below the block are outside the wrapper, and no layer wobbles on its own.
    expect(
      wrapper.element.querySelectorAll('.tray-glass__inner > .tray-glass__layer'),
    ).toHaveLength(layers.length - size);
  });

  it('uses a different wobble kind per block size', () => {
    const kinds = [[1], [1, 1], [1, 1, 1]].map((layers) =>
      setup({ layers, selected: true }).find('.tray-glass__block').attributes('data-wobble'),
    );
    expect(new Set(kinds).size).toBe(3);
  });

  it('has no wrapper and no wobble when nothing is selected', () => {
    const wrapper = setup({ layers: [1, 2, 2] });
    expect(wrapper.find('.tray-glass__block').exists()).toBe(false);
    expect(wrapper.find('[data-wobble]').exists()).toBe(false);
  });

  it('keeps the wobble on an invalid tap and ends it on cancel', async () => {
    const wrapper = setup({ layers: [1, 2, 2], selected: true });
    await wrapper.trigger('click');
    expect(wrapper.find('[data-wobble="2"]').exists()).toBe(true);
    await wrapper.setProps({ selected: false });
    expect(wrapper.find('.tray-glass__block').exists()).toBe(false);
    expect(wrapper.find('[data-wobble]').exists()).toBe(false);
  });

  it('sets no wobble with reduced motion, the lifted cue stays', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const wrapper = setup({ layers: [1, 2], selected: true });
    expect(wrapper.find('[data-wobble]').exists()).toBe(false);
    expect(wrapper.find('.tray-glass__block--wobble').exists()).toBe(false);
    expect(wrapper.find('.tray-glass__block--lifted').exists()).toBe(true);
  });

  describe('landing', () => {
    const landing = (extra: object = {}) => ({
      tray: 0,
      moved: 2,
      merged: true,
      x: -40,
      y: 0,
      phase: 'flow' as const,
      key: 1,
      ...extra,
    });

    it('marks the landed layers with flow in the flow phase', () => {
      const wrapper = setup({ layers: [1, 2, 2], landing: landing({ merged: false }) });
      expect(wrapper.findAll('.tray-glass__layer--flow')).toHaveLength(2);
      expect(wrapper.find('.tray-glass__layer--merge').exists()).toBe(false);
      expect(wrapper.find('.tray-glass').attributes('data-landing-phase')).toBe('flow');
    });

    it('hovers the poured block and only the top layer of the target, anchored', () => {
      const wrapper = setup({
        layers: [1, 3, 3, 3, 3, 3],
        capacity: 6,
        landing: landing({ moved: 2, phase: 'hover' }),
      });
      const existing = wrapper.find('.tray-glass__block--hover-existing');
      const poured = wrapper.find('.tray-glass__block--hover-poured');
      expect(existing.attributes('data-wobble')).toBe('1');
      expect(poured.attributes('data-wobble')).toBe('2');
      for (const block of [existing, poured]) {
        expect(block.classes()).toContain('tray-glass__block--wobble');
        expect(block.classes()).toContain('tray-glass__block--anchored');
      }
      expect(existing.findAll('.tray-glass__layer')).toHaveLength(1);
      expect(poured.findAll('.tray-glass__layer')).toHaveLength(2);
      expect(wrapper.find('.tray-glass__block--lifted').exists()).toBe(false);
      expect(wrapper.findAll('.tray-glass__layer')).toHaveLength(6);
      expect(wrapper.find('.tray-glass__layer--flow').exists()).toBe(false);
    });

    it.each([1, 2, 3, 4])(
      'wraps only the top layer of a target block of %i layers, the rest stays plain',
      (size) => {
        const layers = [1, ...Array<number>(size).fill(3), 3];
        const wrapper = setup({
          layers,
          capacity: 8,
          landing: landing({ moved: 1, phase: 'hover' }),
        });
        const wrappers = wrapper.findAll('.tray-glass__block--hover-existing');
        expect(wrappers).toHaveLength(1);
        expect(wrappers[0]!.findAll('.tray-glass__layer')).toHaveLength(1);
        // Everything below the top layer of the target is a direct child of the glass, no wrapper.
        expect(
          wrapper.element.querySelectorAll('.tray-glass__inner > .tray-glass__layer'),
        ).toHaveLength(layers.length - 2);
        expect(wrapper.findAll('.tray-glass__block')).toHaveLength(2);
        expect(
          wrapper.element.querySelectorAll('.tray-glass__block--wobble .tray-glass__block'),
        ).toHaveLength(0);
      },
    );

    it('joins the wobbling top layer square to the still layer below and to the poured block', () => {
      const wrapper = setup({
        layers: [3, 3, 3, 3],
        landing: landing({ moved: 1, phase: 'hover' }),
      });
      const layers = wrapper.findAll('.tray-glass__layer');
      expect(layers[1]!.classes()).toContain('tray-glass__layer--join-above');
      expect(layers[2]!.classes()).toContain('tray-glass__layer--join-below');
      expect(layers[2]!.classes()).toContain('tray-glass__layer--join-above');
      expect(layers[3]!.classes()).toContain('tray-glass__layer--join-below');
      const existing = wrapper.find('.tray-glass__block--hover-existing');
      expect(existing.find('.tray-glass__layer').element).toBe(layers[2]!.element);
    });

    it('lowers and merges in the merge phase: no wrappers, joined corners', () => {
      const wrapper = setup({ layers: [3, 3], landing: landing({ moved: 2, phase: 'merge' }) });
      expect(wrapper.find('.tray-glass__block').exists()).toBe(false);
      expect(wrapper.findAll('.tray-glass__layer--merge')).toHaveLength(2);
      expect(wrapper.findAll('.tray-glass__layer--settle')).toHaveLength(0);
      const joined = setup({ layers: [3, 3, 3], landing: landing({ moved: 1, phase: 'merge' }) });
      expect(joined.findAll('.tray-glass__layer--settle')).toHaveLength(2);
      const [a, b] = joined.findAll('.tray-glass__layer');
      expect(a!.classes()).toContain('tray-glass__layer--join-above');
      expect(b!.classes()).toContain('tray-glass__layer--join-below');
    });

    it('has no hover into an empty tray', () => {
      const empty = setup({ layers: [3, 3], landing: landing({ merged: false, phase: 'hover' }) });
      expect(empty.find('.tray-glass__block').exists()).toBe(false);
      expect(empty.find('[data-wobble]').exists()).toBe(false);
    });
  });

  it('squares the touching corners of equal neighbours', () => {
    const wrapper = setup({ layers: [2, 2, 3] });
    const [a, b, c] = wrapper.findAll('.tray-glass__layer');
    expect(a!.classes()).toContain('tray-glass__layer--join-above');
    expect(b!.classes()).toContain('tray-glass__layer--join-below');
    expect(c!.classes()).not.toContain('tray-glass__layer--join-below');
  });
});

describe('topBlockStart', () => {
  it('finds the start of the top run', () => {
    expect(topBlockStart([])).toBe(-1);
    expect(topBlockStart([3])).toBe(0);
    expect(topBlockStart([1, 2, 2])).toBe(1);
    expect(topBlockStart([2, 1, 2])).toBe(2);
    expect(topBlockStart([4, 4, 4, 4])).toBe(0);
  });
});
