// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { defaultGameRegistry } from '../common/composables/game-registry';
import { useProfile } from '../common/profile/use-profile';
import { seedBestForTests, storedResult } from '../common/profile/seed-best-for-tests';
import GameSelectionView from './GameSelectionView.vue';

function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: GameSelectionView }],
  });
  return mount(GameSelectionView, { global: { plugins: [router] } });
}

describe('GameSelectionView', () => {
  beforeEach(() => {
    seedBestForTests([]);
  });

  it('shows the hero heading and the coming soon block', () => {
    const wrapper = mountView();
    expect(wrapper.findAll('h1')).toHaveLength(1);
    expect(wrapper.find('h1').text()).toBe('Welcome to Mindwhile!');
    expect(wrapper.find('.coming-soon h2').text()).toBe('More games are coming');
    expect(wrapper.find('.coming-soon').text()).toContain('new puzzles');
    expect(wrapper.find('.coming-soon a, .coming-soon button, .coming-soon form').exists()).toBe(
      false,
    );
  });

  it('shows one tile for Spillit with symbol, name and no result', () => {
    const wrapper = mountView();
    const tiles = wrapper.findAll('.tiles a');
    expect(tiles).toHaveLength(1);
    const tile = tiles[0]!;
    expect(tile.attributes('href')).toBe('/games/spill-it');
    expect(tile.find('svg').exists()).toBe(true);
    expect(tile.find('.tile-name').text()).toBe('Spill It!');
    expect(tile.text()).not.toContain('spill-it');
    expect(tile.classes()).toContain('game-color-orange');
    expect(tile.find('.pill').exists()).toBe(false);
    expect(tile.find('.visually-hidden').text()).toBe('No result yet');
  });

  const spill = () => defaultGameRegistry.getGame('spill-it')!;
  const version = () => spill().manifest.scoringVersion;

  it('shows the formatted result of the highest level with a result', () => {
    seedBestForTests([
      storedResult('spill-it', 'a', [900, 0], version()),
      storedResult('spill-it', 'b', [1000, 2], version()),
    ]);
    const wrapper = mountView();
    expect(wrapper.find('.pill-score').text()).toBe(spill().texts.formatScore([1000, 2]));
    expect(wrapper.find('.pill-level').text()).toBe(spill().texts.levelName('b'));
    expect(wrapper.text()).not.toContain(spill().texts.formatScore([900, 0]));
  });

  it('ignores a result of another scoring version', () => {
    seedBestForTests([storedResult('spill-it', 'a', [900, 0], version() + 1)]);
    const wrapper = mountView();
    expect(wrapper.find('.pill').exists()).toBe(false);
    expect(wrapper.find('.visually-hidden').text()).toBe('No result yet');
  });

  it('ignores results for an unknown level or game', () => {
    seedBestForTests([
      storedResult('spill-it', 'zz', [900, 0], version()),
      storedResult('nope', 'a', [900, 0], 1),
    ]);
    const wrapper = mountView();
    expect(wrapper.find('.pill').exists()).toBe(false);
  });

  it('updates when a result is recorded while the page is open', async () => {
    const wrapper = mountView();
    expect(wrapper.find('.pill').exists()).toBe(false);
    useProfile().recordRoundResult(spill().manifest, 'a', 1, { roundEnd: 'won', score: [640, 0] });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.pill-score').text()).toBe(spill().texts.formatScore([640, 0]));
  });

  it('has no level links', () => {
    const wrapper = mountView();
    expect(wrapper.findAll('a').every((a) => !a.attributes('href')?.startsWith('/play/'))).toBe(
      true,
    );
  });
});
