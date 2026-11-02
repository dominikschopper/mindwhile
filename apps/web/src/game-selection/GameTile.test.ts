// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { defineComponent, h } from 'vue';
import GameTile from './GameTile.vue';

const Symbol = defineComponent({ render: () => h('svg') });

function mountTile(props: Record<string, unknown> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: Symbol }],
  });
  return mount(GameTile, {
    props: { id: 'spill-it', name: 'Spill It!', symbol: Symbol, color: 'orange', ...props },
    global: { plugins: [router] },
  });
}

describe('GameTile', () => {
  it('links to the game page and carries the game color class', () => {
    const wrapper = mountTile();
    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes('href')).toBe('/games/spill-it');
    expect(wrapper.classes()).toContain('game-color-orange');
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('renders the score text without a pill when there is a result', () => {
    const wrapper = mountTile({ hiScore: '1234 fake points' });
    expect(wrapper.find('.tile-score').text()).toBe('Top result: 1234 fake points');
    expect(wrapper.find('.pill').exists()).toBe(false);
    expect(wrapper.find('.visually-hidden').exists()).toBe(false);
  });

  it('renders no score without a result, only the hidden text', () => {
    const wrapper = mountTile();
    expect(wrapper.find('.tile-score').exists()).toBe(false);
    expect(wrapper.find('.visually-hidden').text()).toBe('No result yet');
    expect(wrapper.text()).not.toContain('—');
  });

  it('keeps a very long name inside the tile', () => {
    const name = 'A'.repeat(200);
    const wrapper = mountTile({ name });
    const el = wrapper.find('.tile-name');
    expect(el.text()).toBe(name);
    expect(el.classes()).toContain('tile-name');
    expect(wrapper.element.innerHTML).toContain('tile-name');
  });

  it('renders a 40 character name in full', () => {
    const wrapper = mountTile({ name: 'B'.repeat(40) });
    expect(wrapper.find('.tile-name').text()).toHaveLength(40);
  });
});
