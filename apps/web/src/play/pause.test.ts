// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import App from '../App.vue';
import { gameRegistryKey } from '../common/composables/game-registry';
import { resetProfileForTests, useProfile } from '../common/profile/use-profile';
import { createStorage } from '../common/storage';
import { createFakeGame } from './fake-game';
import PlayView from './PlayView.vue';

let visibility: DocumentVisibilityState = 'visible';
let time = 0;
const mounted: Array<{ unmount(): void }> = [];

function setVisibility(state: DocumentVisibilityState): void {
  visibility = state;
  document.dispatchEvent(new Event('visibilitychange'));
}

async function mountPlay(options: { pauseOnReturn?: boolean } = {}) {
  const fake = createFakeGame({ withPause: true, now: () => time, ...options });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<p>selection</p>' } },
      { path: '/games/:id', component: { template: '<p>game page</p>' } },
      { path: '/settings', component: { template: '<p>settings</p>' } },
      { path: '/play/:gameId/:level', component: PlayView, props: true },
    ],
  });
  await router.push('/');
  await router.push('/play/fake/a');
  await router.isReady();
  const wrapper = mount(App, {
    global: { plugins: [router], provide: { [gameRegistryKey as symbol]: fake.registry } },
    attachTo: document.body,
  });
  await vi.waitFor(() => expect(wrapper.text()).not.toContain('Loading'), { timeout: 10_000 });
  await flushPromises();
  mounted.push(wrapper);
  return { wrapper, router };
}

type W = Awaited<ReturnType<typeof mountPlay>>['wrapper'];

const timeText = (w: W) => w.get('[data-testid="fake-time"]').text();
const coverOpen = (w: W) => w.findAll('dialog').some((d) => d.attributes('open') !== undefined);
const abortOpen = (w: W) =>
  w
    .findAll('dialog')
    .some((d) => d.attributes('open') !== undefined && d.text().includes('Abort round?'));
const pauseButton = (w: W) => w.get('[data-testid="fake-pause"]');
const resumeButton = (w: W) => w.findAll('dialog button').find((b) => b.text() === 'Resume')!;

async function tick(ms: number, w: W): Promise<void> {
  time += ms;
  await vi.advanceTimersByTimeAsync(ms);
  await flushPromises();
  void w;
}

beforeEach(() => {
  vi.useFakeTimers();
  time = 0;
  visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  resetProfileForTests(createStorage(null));
  useProfile();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});

afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount();
  document.body.innerHTML = '';
  delete (document as unknown as { visibilityState?: unknown }).visibilityState;
  vi.useRealTimers();
});

describe('pause end to end', () => {
  it('opens the cover on pause and the time stops', async () => {
    const { wrapper } = await mountPlay();
    await tick(1000, wrapper);
    const before = timeText(wrapper);
    expect(Number(before)).toBeGreaterThan(0);
    await pauseButton(wrapper).trigger('click');
    await flushPromises();
    expect(coverOpen(wrapper)).toBe(true);
    expect(wrapper.find('dialog h2').text()).toBe('Paused');
    const atPause = timeText(wrapper);
    await tick(5000, wrapper);
    expect(timeText(wrapper)).toBe(atPause);
  });

  it('marks the cover as a modal dialog (showModal), so the footer is inert behind it', async () => {
    const { wrapper } = await mountPlay();
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    await pauseButton(wrapper).trigger('click');
    await flushPromises();
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(showModal.mock.contexts[0]).toBe(wrapper.get('dialog[open]').element);
  });

  it('resumes with the Resume button and the time continues', async () => {
    const { wrapper } = await mountPlay();
    await pauseButton(wrapper).trigger('click');
    await flushPromises();
    const atPause = timeText(wrapper);
    await tick(3000, wrapper);
    await resumeButton(wrapper).trigger('click');
    await flushPromises();
    expect(coverOpen(wrapper)).toBe(false);
    expect(timeText(wrapper)).toBe(atPause);
    await tick(2000, wrapper);
    expect(Number(timeText(wrapper))).toBeGreaterThan(Number(atPause));
  });

  it('resumes with Escape and returns the focus to the pause button', async () => {
    const { wrapper } = await mountPlay();
    const button = pauseButton(wrapper);
    (button.element as HTMLElement).focus();
    expect(document.activeElement).toBe(button.element);
    await button.trigger('click');
    await flushPromises();
    expect(coverOpen(wrapper)).toBe(true);
    (document.activeElement as HTMLElement | null)?.blur();
    await wrapper.get('dialog[open]').trigger('keydown', { key: 'Escape' });
    await flushPromises();
    expect(coverOpen(wrapper)).toBe(false);
    expect(document.activeElement).toBe(button.element);
    const atResume = timeText(wrapper);
    await tick(1000, wrapper);
    expect(Number(timeText(wrapper))).toBeGreaterThan(Number(atResume));
  });

  it('Back closes the pause first, a second Back asks to abort', async () => {
    const { wrapper, router } = await mountPlay();
    await pauseButton(wrapper).trigger('click');
    await flushPromises();
    router.back();
    await flushPromises();
    expect(coverOpen(wrapper)).toBe(false);
    expect(abortOpen(wrapper)).toBe(false);
    expect(router.currentRoute.value.path).toBe('/play/fake/a');
    router.back();
    await flushPromises();
    expect(abortOpen(wrapper)).toBe(true);
    expect(router.currentRoute.value.path).toBe('/play/fake/a');
  });

  it('a navigation to another route while paused only resumes', async () => {
    const { wrapper, router } = await mountPlay();
    await pauseButton(wrapper).trigger('click');
    await flushPromises();
    void router.push('/settings');
    await flushPromises();
    expect(coverOpen(wrapper)).toBe(false);
    expect(abortOpen(wrapper)).toBe(false);
    expect(router.currentRoute.value.path).toBe('/play/fake/a');
  });

  it('Back without a layer opens the abort dialog', async () => {
    const { wrapper, router } = await mountPlay();
    router.back();
    await flushPromises();
    expect(abortOpen(wrapper)).toBe(true);
  });

  it('hiding and showing the page does not count the hidden time and shows no cover', async () => {
    const { wrapper } = await mountPlay();
    await tick(1000, wrapper);
    setVisibility('hidden');
    await tick(10_000, wrapper);
    setVisibility('visible');
    await tick(0, wrapper);
    expect(coverOpen(wrapper)).toBe(false);
    const back = Number(timeText(wrapper));
    expect(back).toBeGreaterThanOrEqual(1000);
    expect(back).toBeLessThan(2000);
    await tick(1000, wrapper);
    expect(Number(timeText(wrapper))).toBeGreaterThanOrEqual(back + 900);
  });

  it('with pauseOnReturn the cover opens when the page returns and stays open', async () => {
    const { wrapper } = await mountPlay({ pauseOnReturn: true });
    setVisibility('hidden');
    await tick(1000, wrapper);
    expect(coverOpen(wrapper)).toBe(false);
    setVisibility('visible');
    await flushPromises();
    expect(coverOpen(wrapper)).toBe(true);
    const atReturn = timeText(wrapper);
    await tick(5000, wrapper);
    expect(coverOpen(wrapper)).toBe(true);
    expect(timeText(wrapper)).toBe(atReturn);
  });

  it('an open cover stays open and the time does not run across hidden and visible', async () => {
    const { wrapper } = await mountPlay();
    await tick(500, wrapper);
    await pauseButton(wrapper).trigger('click');
    await flushPromises();
    const atPause = timeText(wrapper);
    setVisibility('hidden');
    await tick(5000, wrapper);
    setVisibility('visible');
    await tick(5000, wrapper);
    expect(coverOpen(wrapper)).toBe(true);
    expect(timeText(wrapper)).toBe(atPause);
  });

  it('keeps keys away from window listeners while the cover is open', async () => {
    const { wrapper } = await mountPlay();
    await pauseButton(wrapper).trigger('click');
    await flushPromises();
    const spy = vi.fn();
    window.addEventListener('keydown', spy);
    resumeButton(wrapper).element.dispatchEvent(
      new KeyboardEvent('keydown', { key: '2', bubbles: true }),
    );
    window.removeEventListener('keydown', spy);
    expect(spy).not.toHaveBeenCalled();
  });

  it('leaves no timer and no stuck layer after the round is aborted', async () => {
    const { wrapper, router } = await mountPlay();
    await tick(1000, wrapper);
    router.back();
    await flushPromises();
    await wrapper
      .findAll('dialog button')
      .find((b) => b.text() === 'Abort round')!
      .trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/games/fake');
    expect(vi.getTimerCount()).toBe(0);
  });
});
