// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';
import { createFakeGame } from './fake-game';

async function mountView(options: Parameters<typeof createFakeGame>[0]) {
  const fake = createFakeGame(options);
  const module = await fake.entry.loadModule();
  const round = module.createRound({ level: 'a', seed: 1 });
  const wrapper = mount(module.View as Component, { props: { round } });
  return { wrapper, round };
}

describe('fake game view', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders only the win button by default', async () => {
    const { wrapper } = await mountView({});
    expect(wrapper.html()).toBe('<button type="button" class="fake-win">win</button>');
  });

  it('mounts and unmounts with pause without a pending timer', async () => {
    vi.useFakeTimers();
    const { wrapper } = await mountView({ withPause: true });
    expect(wrapper.find('.fake-win').exists()).toBe(true);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
