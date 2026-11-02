// @vitest-environment happy-dom
import { createActiveClock, createActivitySignal } from '@mindwhile/core';
import { mount } from '@vue/test-utils';
import { defineComponent, h, type Ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useElapsed } from './use-elapsed';

interface Setup {
  elapsed: Readonly<Ref<number>>;
  elapsedMs: ReturnType<typeof vi.fn<() => number>>;
  real: ReturnType<typeof createActiveClock>;
  activity: ReturnType<typeof createActivitySignal>;
  unmount: () => void;
  advance(ms: number): void;
}

function setup(options: { intervalMs?: number; active?: boolean; runFor?: number } = {}): Setup {
  let time = 1000;
  const activity = createActivitySignal(options.active ?? true);
  const real = createActiveClock({ activity, now: () => time });
  // Time that has already passed before the composable is called.
  time += options.runFor ?? 0;
  // The spy lets the tests count how often the composable reads the clock.
  const elapsedMs = vi.fn(() => real.elapsedMs());
  const clock = {
    elapsedMs,
    isRunning: () => real.isRunning(),
    subscribe: (listener: (running: boolean) => void) => real.subscribe(listener),
  };
  let elapsed!: Readonly<Ref<number>>;
  const Host = defineComponent({
    setup() {
      elapsed = useElapsed(clock, options.intervalMs);
      return () => h('div');
    },
  });
  const wrapper = mount(Host);
  return {
    elapsed,
    elapsedMs,
    real,
    activity,
    unmount: () => wrapper.unmount(),
    // Move the clock and the fake timers in lockstep, one millisecond at a time,
    // so every timer tick reads the time at which it fires.
    advance(ms: number) {
      for (let i = 0; i < ms; i++) {
        time += 1;
        vi.advanceTimersByTime(1);
      }
    },
  };
}

describe('useElapsed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with the current elapsed time', () => {
    const { elapsed, elapsedMs } = setup({ runFor: 420 });
    expect(elapsedMs).toHaveBeenCalled();
    expect(elapsed.value).toBe(420);
  });

  it('updates every 250 ms while the clock runs', () => {
    const { elapsed, elapsedMs, advance } = setup();
    elapsedMs.mockClear();
    advance(1000);
    expect(elapsedMs).toHaveBeenCalledTimes(4);
    expect(elapsed.value).toBe(1000);
  });

  it('has no timer pending while the clock is paused or the signal is inactive', () => {
    const inactive = setup({ active: false });
    expect(vi.getTimerCount()).toBe(0);
    inactive.activity.set(true);
    expect(vi.getTimerCount()).toBe(1);
    inactive.activity.set(false);
    expect(vi.getTimerCount()).toBe(0);

    const paused = setup();
    expect(vi.getTimerCount()).toBe(1);
    paused.real.pause();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('shows the exact stopped value after a pause', () => {
    const { elapsed, real, advance } = setup();
    advance(370);
    expect(elapsed.value).toBe(250);
    real.pause();
    expect(elapsed.value).toBe(370);
    advance(1000);
    expect(elapsed.value).toBe(370);
  });

  it('restarts the timer after a resume', () => {
    const { elapsed, real, advance } = setup();
    advance(370);
    real.pause();
    advance(500);
    real.resume();
    expect(elapsed.value).toBe(370);
    expect(vi.getTimerCount()).toBe(1);
    advance(250);
    expect(elapsed.value).toBe(620);
  });

  it('clears the timer when the clock is stopped', () => {
    const { elapsed, real, advance } = setup();
    advance(300);
    real.stop();
    expect(vi.getTimerCount()).toBe(0);
    expect(elapsed.value).toBe(300);
    advance(1000);
    expect(elapsed.value).toBe(300);
  });

  it('clears the timer and the subscription on unmount', () => {
    const { elapsedMs, real, unmount, advance } = setup();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    elapsedMs.mockClear();
    advance(1000);
    real.pause();
    real.resume();
    expect(elapsedMs).not.toHaveBeenCalled();
  });

  it('uses a custom interval', () => {
    const { elapsed, elapsedMs, advance } = setup({ intervalMs: 100 });
    elapsedMs.mockClear();
    advance(1000);
    expect(elapsedMs).toHaveBeenCalledTimes(10);
    expect(elapsed.value).toBe(1000);
  });
});
