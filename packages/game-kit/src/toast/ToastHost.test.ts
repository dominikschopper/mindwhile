// @vitest-environment happy-dom
import { createToastQueue, toastForever, toastTimeouts, type ToastQueue } from '@mindwhile/core';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import ToastHost from './ToastHost.vue';

// Long enough to prove that a toast stays, and a custom time that is not a default.
const aLongTime = 60_000;
const customHideMs = 2000;

let queue: ToastQueue;
let wrapper: VueWrapper | undefined;

function mountHost(): VueWrapper {
  wrapper = mount(ToastHost, { props: { dismissLabel: 'Close', queue } });
  return wrapper;
}

async function advance(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms);
  await nextTick();
}

beforeEach(() => {
  vi.useFakeTimers();
  queue = createToastQueue();
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  vi.useRealTimers();
});

describe('ToastHost', () => {
  it.each([
    ['info', 'status'],
    ['success', 'status'],
    ['warning', 'alert'],
    ['danger', 'alert'],
  ] as const)('%s uses role %s and shows an icon', async (type, role) => {
    const w = mountHost();
    queue.add({ type, message: 'm' });
    await nextTick();
    const toast = w.find(`[role="${role}"]`);
    expect(toast.exists()).toBe(true);
    expect(toast.find('svg.toast-icon').exists()).toBe(true);
  });

  it('title is optional', async () => {
    const w = mountHost();
    queue.add({ type: 'info', message: 'a' });
    await nextTick();
    expect(w.find('.toast-title').exists()).toBe(false);
    queue.add({ type: 'info', message: 'b', title: 'T' });
    await nextTick();
    expect(w.find('.toast-title').text()).toBe('T');
  });

  it('renders markup in the message as text', async () => {
    const w = mountHost();
    queue.add({ type: 'info', message: 'a <b>bold</b>' });
    await nextTick();
    expect(w.find('b').exists()).toBe(false);
    expect(w.find('.toast-message').text()).toBe('a <b>bold</b>');
  });

  it('dismiss button has the label and removes exactly that toast', async () => {
    const w = mountHost();
    queue.add({ type: 'warning', message: 'first' });
    queue.add({ type: 'warning', message: 'second' });
    await nextTick();
    const buttons = w.findAll('button');
    expect(buttons[0]!.attributes('aria-label')).toBe('Close');
    await buttons[0]!.trigger('click');
    expect(queue.list().map((t) => t.message)).toEqual(['second']);
    expect(w.findAll('.toast')).toHaveLength(1);
  });

  it('info and success disappear after 5 s, warning and danger stay', async () => {
    const w = mountHost();
    queue.add({ type: 'info', message: 'i' });
    queue.add({ type: 'success', message: 's' });
    queue.add({ type: 'warning', message: 'w' });
    queue.add({ type: 'danger', message: 'd' });
    await advance(toastTimeouts.info - 1);
    expect(queue.list()).toHaveLength(4);
    await advance(1);
    expect(queue.list().map((t) => t.type)).toEqual(['warning', 'danger']);
    await advance(aLongTime);
    expect(queue.list()).toHaveLength(2);
    expect(w.findAll('.toast')).toHaveLength(2);
  });

  it('respects explicit hideAfterMs and 0', async () => {
    mountHost();
    queue.add({ type: 'info', message: 'short', hideAfterMs: customHideMs });
    queue.add({ type: 'info', message: 'stays', hideAfterMs: toastForever });
    await advance(customHideMs);
    expect(queue.list().map((t) => t.message)).toEqual(['stays']);
    await advance(aLongTime);
    expect(queue.list()).toHaveLength(1);
  });

  it('shows two toasts in order', async () => {
    const w = mountHost();
    queue.add({ type: 'info', message: 'one' });
    queue.add({ type: 'info', message: 'two' });
    await nextTick();
    expect(w.findAll('.toast-message').map((n) => n.text())).toEqual(['one', 'two']);
  });

  it('hover pauses and resumes with the remaining time', async () => {
    const w = mountHost();
    queue.add({ type: 'info', message: 'i' });
    await nextTick();
    const elapsed = toastTimeouts.info - 2000;
    await advance(elapsed);
    await w.find('.toast').trigger('mouseenter');
    await advance(aLongTime);
    expect(queue.list()).toHaveLength(1);
    await w.find('.toast').trigger('mouseleave');
    await advance(toastTimeouts.info - elapsed - 1);
    expect(queue.list()).toHaveLength(1);
    await advance(1);
    expect(queue.list()).toHaveLength(0);
  });

  it('focus pauses and resumes, focus moving inside the card does not resume', async () => {
    const w = mountHost();
    queue.add({ type: 'info', message: 'i' });
    await nextTick();
    const elapsedFocus = 2000;
    await advance(elapsedFocus);
    await w.find('.toast').trigger('focusin');
    await advance(aLongTime);
    expect(queue.list()).toHaveLength(1);
    await w.find('.toast').trigger('focusout', { relatedTarget: w.find('button').element });
    await advance(aLongTime);
    expect(queue.list()).toHaveLength(1);
    await w.find('.toast').trigger('focusout');
    await advance(toastTimeouts.info - elapsedFocus - 1);
    expect(queue.list()).toHaveLength(1);
    await advance(1);
    expect(queue.list()).toHaveLength(0);
  });

  it('leaves no timers after unmount', async () => {
    const w = mountHost();
    queue.add({ type: 'info', message: 'i' });
    queue.add({ type: 'success', message: 's' });
    await nextTick();
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    w.unmount();
    wrapper = undefined;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the timer of a toast dismissed otherwise', async () => {
    mountHost();
    const id = queue.add({ type: 'info', message: 'i' });
    await nextTick();
    queue.dismiss(id);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('renders nothing without a queue', () => {
    wrapper = mount(ToastHost, { props: { dismissLabel: 'Close' } });
    expect(wrapper.find('.toast-host').exists()).toBe(false);
  });

  // Reduced motion is handled purely in CSS (@media prefers-reduced-motion), the
  // component exposes no transition state, so there is nothing to assert here.
  it.skip('reduced motion: handled in CSS only', () => {});
});
