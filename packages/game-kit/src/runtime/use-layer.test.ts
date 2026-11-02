// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref, type Ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { createLayerRegistry, provideLayers, type LayerRegistry } from './layers';
import { useLayer } from './use-layer';

function layerComp(isOpen: Ref<boolean>, close: () => void) {
  return defineComponent({
    setup() {
      useLayer(isOpen, close);
      return () => h('div');
    },
  });
}

function withRegistry(registry: LayerRegistry, ...children: ReturnType<typeof defineComponent>[]) {
  return defineComponent({
    setup() {
      provideLayers(registry);
      return () => children.map((c) => h(c));
    },
  });
}

describe('useLayer', () => {
  it('registers when isOpen becomes true and removes when false', () => {
    const registry = createLayerRegistry();
    const isOpen = ref(false);
    const close = vi.fn();
    mount(withRegistry(registry, layerComp(isOpen, close)));
    expect(registry.closeTopmost()).toBe(false);
    isOpen.value = true;
    expect(registry.closeTopmost()).toBe(true);
    expect(close).toHaveBeenCalledTimes(1);
    isOpen.value = false;
    expect(registry.closeTopmost()).toBe(false);
  });

  it('registers at once if already open and removes on unmount', () => {
    const registry = createLayerRegistry();
    const close = vi.fn();
    const wrapper = mount(withRegistry(registry, layerComp(ref(true), close)));
    expect(registry.closeTopmost()).toBe(true);
    expect(close).toHaveBeenCalledTimes(1);
    wrapper.unmount();
    expect(registry.closeTopmost()).toBe(false);
  });

  it('does nothing and does not throw without a registry', () => {
    const isOpen = ref(true);
    expect(() => mount(layerComp(isOpen, vi.fn()))).not.toThrow();
    isOpen.value = false;
  });

  it('closes layers of two components in reverse order of opening', () => {
    const registry = createLayerRegistry();
    const a = ref(false);
    const b = ref(false);
    const order: string[] = [];
    mount(
      withRegistry(
        registry,
        layerComp(a, () => order.push('a')),
        layerComp(b, () => order.push('b')),
      ),
    );
    b.value = true;
    a.value = true;
    registry.closeTopmost();
    expect(order).toEqual(['a']);
    a.value = false;
    registry.closeTopmost();
    expect(order).toEqual(['a', 'b']);
  });
});
