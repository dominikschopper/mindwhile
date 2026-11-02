// @vitest-environment happy-dom
import { createActivitySignal, type ActivitySignal } from '@mindwhile/core';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import * as index from '../index';
import { activityKey, provideActivity, useActivity } from './activity';
import { layersKey } from './layers';

function capture(): { signal: () => ActivitySignal; Comp: ReturnType<typeof defineComponent> } {
  let got: ActivitySignal | undefined;
  const Comp = defineComponent({
    setup() {
      got = useActivity();
      return () => h('div');
    },
  });
  return { signal: () => got!, Comp };
}

describe('injection keys', () => {
  it('are Symbol.for symbols', () => {
    expect(Symbol.keyFor(activityKey as symbol)).toBe('mindwhile.activity');
    expect(Symbol.keyFor(layersKey as symbol)).toBe('mindwhile.layers');
  });

  it('are not exported from the package index', () => {
    expect(index).not.toHaveProperty('activityKey');
    expect(index).not.toHaveProperty('layersKey');
  });
});

describe('useActivity', () => {
  it('returns a shared working active signal without a provider', () => {
    const a = capture();
    const b = capture();
    mount(a.Comp);
    mount(b.Comp);
    expect(a.signal().isActive()).toBe(true);
    expect(a.signal()).toBe(b.signal());
    const seen: boolean[] = [];
    const off = a.signal().subscribe((v) => seen.push(v));
    a.signal().set(false);
    expect(seen).toEqual([false]);
    a.signal().set(true);
    off();
  });

  it('returns the provided signal and delivers changes to a child subscriber', () => {
    const provided = createActivitySignal(true);
    const seen: boolean[] = [];
    let got: ActivitySignal | undefined;
    const Child = defineComponent({
      setup() {
        got = useActivity();
        got.subscribe((v) => seen.push(v));
        return () => h('span');
      },
    });
    const Parent = defineComponent({
      setup() {
        provideActivity(provided);
        return () => h(Child);
      },
    });
    mount(Parent);
    expect(got).toBe(provided);
    provided.set(false);
    expect(seen).toEqual([false]);
  });
});
