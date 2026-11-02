import { describe, expect, it, vi } from 'vitest';
import { createLayerRegistry } from './layers';

describe('createLayerRegistry', () => {
  it('returns false on closeTopmost when empty', () => {
    expect(createLayerRegistry().closeTopmost()).toBe(false);
  });

  it('closes the later layer first and returns true', () => {
    const registry = createLayerRegistry();
    const first = vi.fn();
    const second = vi.fn();
    registry.register(first);
    registry.register(second);
    expect(registry.closeTopmost()).toBe(true);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  it('does not remove the layer itself on close', () => {
    const registry = createLayerRegistry();
    const close = vi.fn();
    registry.register(close);
    registry.closeTopmost();
    registry.closeTopmost();
    expect(close).toHaveBeenCalledTimes(2);
  });

  it('unregister removes only that layer and a second call does nothing', () => {
    const registry = createLayerRegistry();
    const first = vi.fn();
    const second = vi.fn();
    const off1 = registry.register(first);
    registry.register(second);
    off1();
    off1();
    registry.closeTopmost();
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    const offTop = registry.register(vi.fn());
    offTop();
    offTop();
    registry.closeTopmost();
    expect(second).toHaveBeenCalledTimes(2);
  });
});
