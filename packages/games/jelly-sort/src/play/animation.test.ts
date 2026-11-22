// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LANDING_TIMING,
  createLandingTimer,
  describePour,
  flowOffset,
  landingDuration,
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
  it('steps through hover and merge and ends with null', () => {
    vi.useFakeTimers();
    const seen: unknown[] = [];
    const timer = createLandingTimer((phase) => seen.push(phase));
    timer.start(true);
    vi.advanceTimersByTime(LANDING_TIMING.flow);
    expect(seen).toEqual(['hover']);
    vi.advanceTimersByTime(LANDING_TIMING.hover);
    expect(seen).toEqual(['hover', 'merge']);
    vi.advanceTimersByTime(LANDING_TIMING.merge);
    expect(seen).toEqual(['hover', 'merge', null]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('is flow only without a hover', () => {
    vi.useFakeTimers();
    const seen: unknown[] = [];
    const timer = createLandingTimer((phase) => seen.push(phase));
    timer.start(false);
    vi.advanceTimersByTime(landingDuration(false));
    expect(seen).toEqual([null]);
  });

  it('does not fire after cancel and a restart drops the old timers', () => {
    vi.useFakeTimers();
    const onPhase = vi.fn();
    const timer = createLandingTimer(onPhase);
    timer.start(true);
    timer.cancel();
    vi.advanceTimersByTime(landingDuration(true) * 2);
    expect(onPhase).not.toHaveBeenCalled();
    timer.start(true);
    vi.advanceTimersByTime(LANDING_TIMING.flow - 1);
    timer.start(true);
    vi.advanceTimersByTime(LANDING_TIMING.flow - 1);
    expect(onPhase).not.toHaveBeenCalled();
    timer.cancel();
    expect(vi.getTimerCount()).toBe(0);
  });
});
