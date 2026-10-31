// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import HowToPlay from './how-to-play/HowToPlay.vue';
import LevelPreview from './level-preview/LevelPreview.vue';
import { gameModule } from './module';
import { createRound } from './round/round';
import { t } from './texts';

describe('gameModule', () => {
  it('has the manifest and the round factory from round.ts', () => {
    expect(gameModule.manifest.id).toBe('spill-it');
    expect(gameModule.createRound).toBe(createRound);
    expect(gameModule.View).toBeDefined();
    expect(gameModule.HowToPlay).toBe(HowToPlay);
    expect(gameModule.LevelPreview).toBe(LevelPreview);
  });

  it('creates a round with apply, serialize and result', () => {
    const round = gameModule.createRound({ level: 'a', seed: 1 });
    expect(typeof round.apply).toBe('function');
    expect(typeof round.serialize).toBe('function');
    expect(typeof round.result).toBe('function');
  });

  it('does not export formatScore, it lives in the game texts', async () => {
    const mod = await import('./module');
    expect('formatScore' in mod).toBe(false);
  });
});

describe('HowToPlay', () => {
  it('shows the rules at once, without a toggle of its own', () => {
    const wrapper = mount(HowToPlay, { attachTo: document.body });
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.findAll('p')[0]!.text()).toBe(t('howTo.rules.pick'));

    const headings = wrapper.findAll('h2').map((h) => h.text());
    expect(headings).toEqual([
      t('howTo.example.heading'),
      t('howTo.counter.heading'),
      t('howTo.score.heading'),
      t('howTo.marks.heading'),
    ]);
    const boards = wrapper.findAll('.example-board');
    expect(boards).toHaveLength(3);
    const cells = boards[0]!.findAll('.example-cell').map((c) => c.find('svg').exists());
    expect(cells).toEqual(Array(9).fill(true));
    expect(boards[0]!.attributes('aria-label')).toBe(
      'Row 1: infinity, alert, alert. Row 2: pulse, infinity, alert. Row 3: pulse, pulse, infinity',
    );
    const afterCells = boards[1]!.findAll('.example-cell').map((c) => c.find('svg').exists());
    expect(afterCells).toEqual(Array(9).fill(true));
    expect(boards[1]!.attributes('aria-label')).toContain('Row 1: alert, alert, alert');
    wrapper.unmount();
  });
});
