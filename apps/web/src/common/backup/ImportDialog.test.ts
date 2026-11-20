// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseFailures } from '@mindwhile/core';
import type { ProfileData } from '@mindwhile/core';
import ImportDialog from './ImportDialog.vue';
import { en } from './texts/en';
import { t } from './texts';

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn() as () => void;
  HTMLDialogElement.prototype.close = vi.fn() as () => void;
});

function data(tag = 'Calm Fox', symbol = 'unknown-shape'): ProfileData {
  return {
    profile: { playerId: 'p', gamerTag: tag, gamerSymbol: symbol, gamerTagChangedAt: 1 },
    best: [
      { gameId: 'spill-it', level: 'a', seed: 1, scoringVersion: 1 } as never,
      { gameId: 'spill-it', level: 'b', seed: 2, scoringVersion: 1 } as never,
    ],
  };
}

function make(props: { data?: ProfileData; skipped?: number } = {}) {
  return mount(ImportDialog, { props: { data: data(), skipped: 0, ...props } });
}

describe('ImportDialog', () => {
  it('renders tag, count and the merge sentence', () => {
    const text = make().text();
    expect(text).toContain('Calm Fox');
    expect(text).toContain('2 best results');
    expect(text).toContain(t('dialog.merge'));
  });

  it('renders markup in the tag as text', () => {
    const wrapper = make({ data: data('<b>x</b>') });
    expect(wrapper.find('.import-tag b').exists()).toBe(false);
    expect(wrapper.get('.import-tag').text()).toBe('<b>x</b>');
  });

  it('shows the skipped hint only when skipped > 0', () => {
    expect(make().find('.import-skipped').exists()).toBe(false);
    expect(make({ skipped: 3 }).get('.import-skipped').text()).toBe(
      '3 results could not be imported.',
    );
  });

  it('emits merge', async () => {
    const wrapper = make();
    await wrapper.get('.import-merge').trigger('click');
    expect(wrapper.emitted('merge')).toHaveLength(1);
  });

  it('emits cancel from the button and from dialog close', async () => {
    const wrapper = make();
    await wrapper.get('.import-cancel').trigger('click');
    await wrapper.get('dialog').trigger('cancel');
    expect(wrapper.emitted('cancel')).toHaveLength(2);
  });
});

describe('backup texts', () => {
  it('has a text for every parse failure, too-large and unreadable', () => {
    for (const reason of [...parseFailures, 'too-large', 'unreadable']) {
      expect(en).toHaveProperty(`failure.${reason}`);
    }
  });
});
