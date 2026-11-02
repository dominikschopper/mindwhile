// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { defaultGameRegistry, gameRegistryKey } from '../common/composables/game-registry';
import type { GameEntry } from '../common/composables/game-registry';
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
    expect(tile.find('.tile-score').exists()).toBe(false);
    expect(tile.find('.visually-hidden').text()).toBe('No result yet');
  });

  const spill = () => defaultGameRegistry.getGame('spill-it')!;
  const version = () => spill().manifest.scoringVersion;

  it('shows the short points text of the highest level with a result, no pills', () => {
    seedBestForTests([
      storedResult('spill-it', 'a', [900, 0], version()),
      storedResult('spill-it', 'b', [1000, 2], version()),
    ]);
    const wrapper = mountView();
    expect(wrapper.find('.tile-score').text()).toBe('Top result: 1000 points');
    expect(wrapper.find('.tile-score').text()).toContain(
      spill().texts.formatScoreShort?.([1000, 2]),
    );
    expect(wrapper.text()).not.toContain('faster');
    expect(wrapper.text()).not.toContain('slower');
    expect(wrapper.text()).not.toContain(spill().texts.levelName('b'));
    expect(wrapper.text()).not.toContain('900 points');
    expect(wrapper.find('.pill').exists()).toBe(false);
  });

  it('ignores a result of another scoring version', () => {
    seedBestForTests([storedResult('spill-it', 'a', [900, 0], version() + 1)]);
    const wrapper = mountView();
    expect(wrapper.find('.tile-score').exists()).toBe(false);
    expect(wrapper.find('.visually-hidden').text()).toBe('No result yet');
  });

  it('ignores results for an unknown level or game', () => {
    seedBestForTests([
      storedResult('spill-it', 'zz', [900, 0], version()),
      storedResult('nope', 'a', [900, 0], 1),
    ]);
    const wrapper = mountView();
    expect(wrapper.find('.tile-score').exists()).toBe(false);
  });

  it('updates when a result is recorded while the page is open', async () => {
    const wrapper = mountView();
    expect(wrapper.find('.tile-score').exists()).toBe(false);
    useProfile().recordRoundResult(spill().manifest, 'a', 1, { roundEnd: 'won', score: [640, 0] });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.tile-score').text()).toBe('Top result: 640 points');
  });

  it('falls back to formatScore when a game has no short form', () => {
    const entry: GameEntry = {
      id: 'plain',
      manifest: {
        id: 'plain',
        symbol: 'grid-2x2',
        color: 'blue',
        gameVersion: 1,
        scoringVersion: 1,
        interfaceVersion: 1,
        levels: ['a'],
        scoring: [{ key: 'points', better: 'higher' }],
      },
      texts: {
        name: 'Plain',
        tagline: '',
        summary: '',
        levelName: (level) => level,
        formatScore: (score) => `${score[0]} long points`,
      },
      loadModule: () => Promise.reject(new Error('not needed')),
    };
    seedBestForTests([storedResult('plain', 'a', [70], 1)]);
    const wrapper = mount(GameSelectionView, {
      global: {
        plugins: [createRouter({ history: createMemoryHistory(), routes: [] })],
        provide: {
          [gameRegistryKey as symbol]: {
            listGames: () => [entry],
            getGame: (id: string) => (id === entry.id ? entry : undefined),
          },
        },
      },
    });
    expect(wrapper.find('.tile-score').text()).toBe('Top result: 70 long points');
  });

  it('has no level links', () => {
    const wrapper = mountView();
    expect(wrapper.findAll('a').every((a) => !a.attributes('href')?.startsWith('/play/'))).toBe(
      true,
    );
  });
});
