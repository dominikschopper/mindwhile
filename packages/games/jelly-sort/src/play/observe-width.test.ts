import { describe, expect, it, vi } from 'vitest';
import { observeWidth } from './observe-width';

describe('observeWidth', () => {
  it('observes the element, reports widths and disconnects on stop', () => {
    let report: (width: number) => void = () => {};
    const observer = { observe: vi.fn(), disconnect: vi.fn() };
    const element = {};
    const onWidth = vi.fn();
    const stop = observeWidth(element, onWidth, (cb) => {
      report = cb;
      return observer;
    });
    expect(observer.observe).toHaveBeenCalledWith(element);
    report(320);
    expect(onWidth).toHaveBeenCalledWith(320);
    stop();
    expect(observer.disconnect).toHaveBeenCalled();
  });

  it('does nothing without an element or an observer', () => {
    expect(() => observeWidth(null, () => {})()).not.toThrow();
    expect(() =>
      observeWidth(
        {},
        () => {},
        () => null,
      )(),
    ).not.toThrow();
  });
});
