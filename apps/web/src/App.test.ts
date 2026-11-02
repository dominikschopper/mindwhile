// @vitest-environment happy-dom
import { ChromeSlot, IconSymbolPlaceholder, profileSymbols } from '@mindwhile/game-kit';
import { mount } from '@vue/test-utils';
import { serializeProfile } from '@mindwhile/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import App from './App.vue';
import { registerAbortHandler, setRoundState } from './common/composables/use-chrome';
import { dismissNotice, showNotice } from './common/composables/use-notice';
import { PROFILE_KEY, resetProfileForTests } from './common/profile/use-profile';
import { createStorage } from './common/storage';

/** Puts a profile with the given tag and symbol into an in-memory storage (no localStorage). */
function seedProfile(gamerTag: string, gamerSymbol: string): void {
  const storage = createStorage(null);
  storage.set(
    PROFILE_KEY,
    JSON.stringify(
      serializeProfile({
        profile: { playerId: 'AAAAAAAAAAA', gamerTag, gamerSymbol, gamerTagChangedAt: 0 },
        best: [],
      }),
    ),
  );
  resetProfileForTests(storage);
}

const SlotChild = defineComponent({
  render: () => h(ChromeSlot, { name: 'footer-center' }, () => h('span', { id: 'probe' }, 'probe')),
});

async function setup(path = '/') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: SlotChild },
      { path: '/settings', component: { template: '<div />' } },
    ],
  });
  await router.push(path);
  const wrapper = mount(App, { global: { plugins: [router] }, attachTo: document.body });
  await wrapper.vm.$nextTick();
  return wrapper;
}

describe('App', () => {
  beforeEach(() => {
    seedProfile('Swift Fox', 'star');
    setRoundState('idle');
    registerAbortHandler(null);
  });
  afterEach(() => {
    dismissNotice();
    document.body.innerHTML = '';
  });

  it('shows a notice in the shell', async () => {
    const wrapper = await setup();
    showNotice('Something went wrong, the round was discarded');
    await wrapper.vm.$nextTick();
    const alert = wrapper.get('[role="alert"]');
    expect(alert.text()).toContain('Something went wrong, the round was discarded');
    expect(wrapper.get('header').element.nextElementSibling?.getAttribute('role')).toBe('alert');
    wrapper.unmount();
  });

  it('renders the landmarks and the app name link', async () => {
    const wrapper = await setup();
    expect(wrapper.find('header').exists()).toBe(true);
    expect(wrapper.find('main').exists()).toBe(true);
    expect(wrapper.find('footer').exists()).toBe(true);
    expect(wrapper.get('header a').text()).toBe('Mindwhile');
    expect(wrapper.get('header a').attributes('href')).toBe('/');
    wrapper.unmount();
  });

  it('shows the stored gamer tag and the svg of the stored symbol in the footer', async () => {
    const wrapper = await setup();
    const tag = wrapper.get('footer .gamer-tag');
    expect(tag.text()).toBe('Swift Fox');
    expect(tag.attributes('title')).toBe('Gamer tag');
    const svg = tag.get('svg');
    expect(svg.attributes('aria-hidden')).toBe('true');
    expect(svg.element.innerHTML).toBe(mount(profileSymbols.star).get('svg').element.innerHTML);
    wrapper.unmount();
  });

  it('shows the placeholder svg for an unknown symbol name', async () => {
    seedProfile('Swift Fox', 'future-shape');
    const wrapper = await setup();
    const tag = wrapper.get('footer .gamer-tag');
    expect(tag.text()).toBe('Swift Fox');
    expect(tag.get('svg').element.innerHTML).toBe(
      mount(IconSymbolPlaceholder).get('svg').element.innerHTML,
    );
    wrapper.unmount();
  });

  it('shows a stored tag as plain text', async () => {
    seedProfile('Swift-Fox 1', 'heart');
    const wrapper = await setup();
    expect(wrapper.get('footer .gamer-tag').text()).toBe('Swift-Fox 1');
    wrapper.unmount();
  });

  it('shows "Back to games" when idle or ended', async () => {
    const wrapper = await setup('/settings');
    for (const state of ['idle', 'ended'] as const) {
      setRoundState(state);
      await wrapper.vm.$nextTick();
      const link = wrapper.get('footer a');
      expect(link.text()).toBe('Back to games');
      expect(link.attributes('href')).toBe('/');
      expect(wrapper.find('footer button').exists()).toBe(false);
    }
    wrapper.unmount();
  });

  it('shows no "Back to games" button on the game selection page', async () => {
    const wrapper = await setup('/');
    for (const state of ['idle', 'ended'] as const) {
      setRoundState(state);
      await wrapper.vm.$nextTick();
      expect(wrapper.get('footer').text()).not.toContain('Back to games');
      expect(wrapper.find('footer a').exists()).toBe(false);
    }
    wrapper.unmount();
  });

  it('shows the abort button while running and calls the handler', async () => {
    const handler = vi.fn();
    registerAbortHandler(handler);
    const wrapper = await setup();
    setRoundState('running');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).not.toContain('Back to games');
    await wrapper.get('footer button').trigger('click');
    expect(handler).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('renders a footer-center ChromeSlot in the footer center', async () => {
    const wrapper = await setup();
    await wrapper.vm.$nextTick();
    const center = document.getElementById('chrome-footer-center');
    expect(center?.querySelector('#probe')).not.toBeNull();
    wrapper.unmount();
  });
});
