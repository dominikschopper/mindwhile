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

  it('shows the Spillit tile with symbol, name and no result', () => {
    const wrapper = mountView();
    // The real registry holds every game, so find the tile of Spillit by its link.
    const tile = wrapper
      .findAll('.tiles a')
      .find((a) => a.attributes('href') === '/games/spill-it')!;
    expect(tile.exists()).toBe(true);
    expect(tile.find('svg').exists()).toBe(true);
    expect(tile.find('.tile-name').text()).toBe('Spill It!');
    expect(tile.text()).not.toContain('spill-it');
    expect(tile.classes()).toContain('game-color-orange');
    expect(tile.find('.tile-score').exists()).toBe(false);
    expect(tile.find('.visually-hidden').text()).toBe('No result yet');
  });

  const spill = () => defaultGameRegistry.getGame('spill-it')!;
  const version = () => spill().manifest.scoringVersion;
  const jelly = () => defaultGameRegistry.getGame('jelly-sort')!;
  const jellyTile = (wrapper: ReturnType<typeof mountView>) =>
    wrapper.findAll('.tiles a').find((a) => a.attributes('href') === '/games/jelly-sort')!;

  it('shows one tile per registered game, each with its name', () => {
    const wrapper = mountView();
    const tiles = wrapper.findAll('.tiles a');
    expect(tiles).toHaveLength(defaultGameRegistry.listGames().length);
    expect(tiles.map((a) => a.find('.tile-name').text())).toEqual(
      expect.arrayContaining([spill().texts.name, jelly().texts.name]),
    );
  });

  it('shows the Jelly Sort tile with symbol, name and no visible result', () => {
    const wrapper = mountView();
    const tile = jellyTile(wrapper);
    expect(tile.exists()).toBe(true);
    expect(tile.find('svg').exists()).toBe(true);
    expect(tile.find('.tile-name').text()).toBe('Jelly Sort');
    expect(tile.classes()).toContain('game-color-green');
    expect(tile.find('.tile-score').exists()).toBe(false);
    expect(tile.find('.visually-hidden').text()).toBe('No result yet');
  });

  it('shows the short points text of the Jelly Sort top result', () => {
    seedBestForTests([
      storedResult('jelly-sort', 'a', [300, 2], jelly().manifest.scoringVersion),
      storedResult('jelly-sort', 'c', [120, 0], jelly().manifest.scoringVersion),
    ]);
    const wrapper = mountView();
    const tile = jellyTile(wrapper);
    // Highest level with a result is c, its short form has only the points.
    expect(tile.find('.tile-score').text()).toBe('Top result: 120 points');
    expect(tile.text()).not.toContain('moves');
    expect(tile.find('.visually-hidden').exists()).toBe(false);
  });

  it('keeps the results of the two games apart on the tiles', () => {
    seedBestForTests([storedResult('spill-it', 'a', [900, 0], version())]);
    const wrapper = mountView();
    expect(jellyTile(wrapper).find('.tile-score').exists()).toBe(false);
    expect(jellyTile(wrapper).find('.visually-hidden').text()).toBe('No result yet');
    const spillTile = wrapper
      .findAll('.tiles a')
      .find((a) => a.attributes('href') === '/games/spill-it')!;
    expect(spillTile.find('.tile-score').text()).toBe('Top result: 900 points');
  });

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
