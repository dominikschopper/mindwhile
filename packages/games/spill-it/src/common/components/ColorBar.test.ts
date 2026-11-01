// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ColorBar from './ColorBar.vue';

const base = { colorCount: 4, regionColor: 0 };

function glowing(wrapper: ReturnType<typeof mount>) {
  return wrapper
    .findAll('.color-button')
    .filter((b) => b.classes().some((c) => c.startsWith('color-button--glow')));
}

describe('ColorBar glow', () => {
  it('glows only the button of the pulse color', () => {
    const wrapper = mount(ColorBar, { props: { ...base, pulse: { color: 2, tick: 2 } } });
    expect(glowing(wrapper)).toHaveLength(1);
    expect(glowing(wrapper)[0]!.attributes('data-color')).toBe('2');
    expect(glowing(wrapper)[0]!.classes()).toContain('color-button--glow-a');
  });

  it('uses the other variant for the other tick parity', () => {
    const wrapper = mount(ColorBar, { props: { ...base, pulse: { color: 2, tick: 3 } } });
    expect(glowing(wrapper)[0]!.classes()).toContain('color-button--glow-b');
    expect(glowing(wrapper)[0]!.classes()).not.toContain('color-button--glow-a');
  });

  it('has no glow class without pulse', () => {
    const wrapper = mount(ColorBar, { props: base });
    expect(glowing(wrapper)).toHaveLength(0);
  });

  it('never glows when decorative', () => {
    const wrapper = mount(ColorBar, {
      props: { ...base, decorative: true, pulse: { color: 1, tick: 0 } },
    });
    expect(glowing(wrapper)).toHaveLength(0);
  });
});
