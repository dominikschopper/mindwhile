import { describe, expect, it, vi } from 'vitest';
import { createActivitySignal } from './activity';

describe('createActivitySignal', () => {
  it('starts active by default and respects initial = false', () => {
    expect(createActivitySignal().isActive()).toBe(true);
    expect(createActivitySignal(false).isActive()).toBe(false);
  });

  it('calls no listener when set with the same value', () => {
    const signal = createActivitySignal(true);
    const listener = vi.fn();
    signal.subscribe(listener);
    signal.set(true);
    expect(listener).not.toHaveBeenCalled();
    expect(signal.isActive()).toBe(true);
  });

  it('calls every listener once with the new value', () => {
    const signal = createActivitySignal(true);
    const first = vi.fn();
    const second = vi.fn();
    signal.subscribe(first);
    signal.subscribe(second);
    signal.set(false);
    expect(first).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledWith(false);
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith(false);
    expect(signal.isActive()).toBe(false);
  });

  it('stops calling a listener after unsubscribe, and a second unsubscribe is harmless', () => {
    const signal = createActivitySignal(true);
    const listener = vi.fn();
    const unsubscribe = signal.subscribe(listener);
    unsubscribe();
    unsubscribe();
    signal.set(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it('does not skip other listeners when one unsubscribes itself during a call', () => {
    const signal = createActivitySignal(true);
    const other = vi.fn();
    let unsubscribeSelf: () => void = () => undefined;
    const selfRemoving = vi.fn(() => {
      unsubscribeSelf();
    });
    unsubscribeSelf = signal.subscribe(selfRemoving);
    signal.subscribe(other);
    signal.set(false);
    expect(selfRemoving).toHaveBeenCalledTimes(1);
    expect(other).toHaveBeenCalledTimes(1);
    expect(other).toHaveBeenCalledWith(false);
  });

  it('calls the listeners twice, in order, for two quick changes', () => {
    const signal = createActivitySignal(true);
    const calls: string[] = [];
    signal.subscribe((active) => calls.push(`a:${String(active)}`));
    signal.subscribe((active) => calls.push(`b:${String(active)}`));
    signal.set(false);
    signal.set(true);
    expect(calls).toEqual(['a:false', 'b:false', 'a:true', 'b:true']);
  });
});
