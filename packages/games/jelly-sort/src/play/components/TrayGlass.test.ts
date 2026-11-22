// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TrayGlass from './TrayGlass.vue';

function setup(props: Partial<InstanceType<typeof TrayGlass>['$props']> = {}) {
  return mount(TrayGlass, {
    props: { layers: [], capacity: 4, selected: false, label: 'Tray 1, empty', ...props },
    attachTo: document.body,
  });
}

describe('TrayGlass', () => {
  it.each([
    [[4, 1], 1],
    [[4, 1, 1], 2],
    [[4, 1, 1, 1], 3],
    [[1, 1, 1, 1], 4],
  ])('wraps the selected top block of %j in one wrapper with all %i layers', (layers, size) => {
    const wrapper = setup({ layers, selected: true });
    const blocks = wrapper.findAll('.tray-glass__block');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.findAll('.tray-glass__layer')).toHaveLength(size);
    expect(wrapper.findAll('.tray-glass__layer')).toHaveLength(layers.length);
    // Layers below the block stay outside the wrapper.
    expect(
      wrapper.element.querySelectorAll('.tray-glass__inner > .tray-glass__layer'),
    ).toHaveLength(layers.length - size);
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
});
