// @vitest-environment happy-dom
import { effectScope, type EffectScope } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePageActivity } from './use-page-activity';

let visibility: DocumentVisibilityState = 'visible';

function setVisibility(state: DocumentVisibilityState): void {
  visibility = state;
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('usePageActivity', () => {
  let scope: EffectScope;

  beforeEach(() => {
    visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });
    scope = effectScope();
  });

  afterEach(() => {
    scope.stop();
    // Remove the test override, so the next test sees the happy-dom default again.
    delete (document as unknown as { visibilityState?: unknown }).visibilityState;
  });

  it('starts active when the document is visible', () => {
    const signal = scope.run(() => usePageActivity());

    expect(signal?.isActive()).toBe(true);
  });

  it('starts inactive when the document is hidden', () => {
    visibility = 'hidden';

    const signal = scope.run(() => usePageActivity());

    expect(signal?.isActive()).toBe(false);
  });

  it('becomes inactive on hidden and notifies a subscriber', () => {
    const signal = scope.run(() => usePageActivity());
    const listener = vi.fn();
    signal?.subscribe(listener);

    setVisibility('hidden');

    expect(signal?.isActive()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(false);
  });

  it('becomes active again when visible', () => {
    const signal = scope.run(() => usePageActivity());
    setVisibility('hidden');
    const listener = vi.fn();
    signal?.subscribe(listener);

    setVisibility('visible');

    expect(signal?.isActive()).toBe(true);
    expect(listener).toHaveBeenCalledWith(true);
  });

  it('notifies once for two events with the same state', () => {
    const signal = scope.run(() => usePageActivity());
    const listener = vi.fn();
    signal?.subscribe(listener);

    setVisibility('hidden');
    setVisibility('hidden');

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('removes the listener when the scope is disposed', () => {
    const signal = scope.run(() => usePageActivity());
    const listener = vi.fn();
    signal?.subscribe(listener);

    scope.stop();
    setVisibility('hidden');

    expect(signal?.isActive()).toBe(true);
    expect(listener).not.toHaveBeenCalled();
  });
});
