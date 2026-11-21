// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LANDING_MS,
  createLandingTimer,
  describePour,
  flowOffset,
  prefersReducedMotion,
} from './animation';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('describePour', () => {
  it('reports the moved layers and a merge on equal colors', () => {
    expect(describePour([1, 2, 2], [3, 2], 1)).toEqual({ moved: 2, merged: true });
  });

  it('reports no merge on different colors or an empty target', () => {
    expect(describePour([1, 2], [3], 1)).toEqual({ moved: 1, merged: false });
    expect(describePour([1, 2], [], 1)).toEqual({ moved: 1, merged: false });
  });
});

describe('flowOffset', () => {
  it('points from the target back to the source', () => {
    expect(flowOffset({ left: 10, top: 5 }, { left: 40, top: 5 })).toEqual({ x: -30, y: 0 });
  });
});

describe('prefersReducedMotion', () => {
  it('follows matchMedia', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    expect(prefersReducedMotion()).toBe(true);
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('createLandingTimer', () => {
  it('clears after the landing time and not after cancel', () => {
    vi.useFakeTimers();
    const clear = vi.fn();
    const timer = createLandingTimer(clear);
    timer.start();
    vi.advanceTimersByTime(LANDING_MS);
    expect(clear).toHaveBeenCalledTimes(1);
    timer.start();
    timer.cancel();
    vi.advanceTimersByTime(LANDING_MS * 2);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
