// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import * as fileIo from '../backup/file-io';
import { gameRegistryKey } from '../composables/game-registry';
import type { GameRegistry } from '../composables/game-registry';
import { PROFILE_KEY, resetProfileForTests } from '../profile/use-profile';
import { createStorage } from '../storage';
import MainMenu from './MainMenu.vue';

vi.mock('../backup/file-io', () => ({ saveProfileFile: vi.fn(), pickFile: vi.fn() }));

const registry: GameRegistry = { listGames: () => [], getGame: () => undefined };

function makeRouter() {
  const Stub = { template: '<div />' };
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: Stub }],
  });
}

describe('MainMenu', () => {
  beforeEach(() => {
    const store = createStorage(null);
    store.set(
      PROFILE_KEY,
      JSON.stringify({
        app: 'mindwhile',
        kind: 'profile',
        fmtv: 1,
        profile: { player: 'AAAAAAAAAAA', tag: 'Test Fox', symbol: 'star', tagat: 0 },
        best: [],
      }),
    );
    resetProfileForTests(store);
    vi.mocked(fileIo.pickFile).mockReset();
    vi.mocked(fileIo.pickFile).mockResolvedValue(null);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function setup() {
    const router = makeRouter();
    await router.push('/');
    const wrapper = mount(MainMenu, {
      global: { plugins: [router], provide: { [gameRegistryKey]: registry } },
      attachTo: document.body,
    });
    return wrapper;
  }

  it('opens and closes by clicking the button', async () => {
    const wrapper = await setup();
    const button = wrapper.get('button[aria-label="Menu"]');
    expect(button.attributes('aria-expanded')).toBe('false');
    expect(button.attributes('aria-controls')).toBe('main-menu-list');
    expect(wrapper.get('#main-menu-list').isVisible()).toBe(false);
    await button.trigger('click');
    expect(button.attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('#main-menu-list').isVisible()).toBe(true);
    await button.trigger('click');
    expect(button.attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  it('closes on Escape and returns focus to the button', async () => {
    const wrapper = await setup();
    const button = wrapper.get('button[aria-label="Menu"]');
    await button.trigger('click');
    await wrapper.get('.backup-export').trigger('keydown', { key: 'Escape' });
    expect(button.attributes('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button.element);
    wrapper.unmount();
  });

  it('closes on outside click', async () => {
    const wrapper = await setup();
    const button = wrapper.get('button[aria-label="Menu"]');
    await button.trigger('click');
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(button.attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  it('contains color scheme, backup and no settings link', async () => {
    const wrapper = await setup();
    await wrapper.get('button[aria-label="Menu"]').trigger('click');
    const list = wrapper.get('#main-menu-list');
    expect(list.findAll('input[type="radio"]').length).toBeGreaterThan(1);
    expect(list.find('.backup-export').exists()).toBe(true);
    expect(list.find('.backup-import').exists()).toBe(true);
    expect(list.find('a').exists()).toBe(false);
    wrapper.unmount();
  });

  it('closes and refocuses the button when the import starts', async () => {
    const wrapper = await setup();
    const button = wrapper.get('button[aria-label="Menu"]');
    await button.trigger('click');
    await wrapper.get('.backup-import').trigger('click');
    await flushPromises();
    expect(fileIo.pickFile).toHaveBeenCalledTimes(1);
    expect(button.attributes('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button.element);
    wrapper.unmount();
  });

  it('has a disabled language entry', async () => {
    const wrapper = await setup();
    await wrapper.get('button[aria-label="Menu"]').trigger('click');
    const language = wrapper
      .findAll('#main-menu-list button')
      .find((b) => b.text().startsWith('Language'))!;
    expect(language.text()).toBe('Language: English');
    expect(language.attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });
});
