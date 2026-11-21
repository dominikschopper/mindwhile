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

  it('shows the lifted state only on the top block when selected', () => {
    const wrapper = setup({ layers: [1, 2, 2], selected: true });
    const layers = wrapper.findAll('.tray-glass__layer');
    expect(layers.map((layer) => layer.classes('tray-glass__layer--lifted'))).toEqual([
      false,
      true,
      true,
    ]);
    expect(wrapper.attributes('aria-pressed')).toBe('true');
  });

  it('shows no lifted layer when not selected', () => {
    const wrapper = setup({ layers: [1, 2, 2] });
    expect(wrapper.find('.tray-glass__layer--lifted').exists()).toBe(false);
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

  it('wobbles only the top block of the selected tray', () => {
    const wrapper = setup({ layers: [1, 2, 2], selected: true });
    const layers = wrapper.findAll('.tray-glass__layer');
    expect(layers.map((layer) => layer.classes('tray-glass__layer--wobble'))).toEqual([
      false,
      true,
      true,
    ]);
  });

  it('does not wobble when not selected', () => {
    const wrapper = setup({ layers: [1, 2, 2] });
    expect(wrapper.find('.tray-glass__layer--wobble').exists()).toBe(false);
  });

  it('sets no wobble with reduced motion, the lifted cue stays', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const wrapper = setup({ layers: [1, 2], selected: true });
    expect(wrapper.find('.tray-glass__layer--wobble').exists()).toBe(false);
    expect(wrapper.find('.tray-glass__layer--lifted').exists()).toBe(true);
  });

  it('marks the landed layers with flow, and merge only for equal colors', () => {
    const landing = { tray: 0, moved: 2, merged: false, x: -40, y: 0, key: 1 };
    const plain = setup({ layers: [1, 2, 2], landing });
    expect(plain.findAll('.tray-glass__layer--flow')).toHaveLength(2);
    expect(plain.find('.tray-glass__layer--merge').exists()).toBe(false);
    const merged = setup({ layers: [2, 2, 2], landing: { ...landing, merged: true } });
    expect(merged.findAll('.tray-glass__layer--merge')).toHaveLength(2);
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
