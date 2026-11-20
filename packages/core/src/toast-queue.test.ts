import { describe, expect, it, vi } from 'vitest';
import {
  createToastQueue,
  defaultHideAfterMs,
  toastForever,
  toastTimeouts,
  toastTypes,
} from './toast-queue';

describe('createToastQueue', () => {
  it('returns increasing ids', () => {
    const queue = createToastQueue();
    const first = queue.add({ type: 'info', message: 'one' });
    const second = queue.add({ type: 'info', message: 'two' });
    expect(second).toBeGreaterThan(first);
  });

  it('uses the configured timeouts: info and success hide, warning and danger stay', () => {
    expect(defaultHideAfterMs('info')).toBe(toastTimeouts.info);
    expect(defaultHideAfterMs('success')).toBe(toastTimeouts.success);
    expect(defaultHideAfterMs('warning')).toBe(toastTimeouts.warning);
    expect(defaultHideAfterMs('danger')).toBe(toastTimeouts.danger);
    expect(toastTimeouts.info).toBeGreaterThan(toastForever);
    expect(toastTimeouts.success).toBeGreaterThan(toastForever);
    expect(toastTimeouts.warning).toBe(toastForever);
    expect(toastTimeouts.danger).toBe(toastForever);

    const queue = createToastQueue();
    queue.add({ type: 'info', message: 'a' });
    queue.add({ type: 'success', message: 'b' });
    queue.add({ type: 'warning', message: 'c' });
    queue.add({ type: 'danger', message: 'd' });
    expect(queue.list().map((toast) => toast.hideAfterMs)).toEqual([
      toastTimeouts.info,
      toastTimeouts.success,
      toastTimeouts.warning,
      toastTimeouts.danger,
    ]);
  });

  it('lists every type in the documented order', () => {
    expect(toastTypes).toEqual(['info', 'success', 'warning', 'danger']);
  });

  it('lets a given hideAfterMs win over the default', () => {
    const queue = createToastQueue();
    queue.add({ type: 'info', message: 'short', hideAfterMs: 2000 });
    queue.add({ type: 'danger', message: 'timed', hideAfterMs: 3000 });
    expect(queue.list().map((toast) => toast.hideAfterMs)).toEqual([2000, 3000]);
  });

  it('keeps an info toast when hideAfterMs is 0', () => {
    const queue = createToastQueue();
    queue.add({ type: 'info', message: 'sticky', hideAfterMs: toastForever });
    expect(queue.list()[0]?.hideAfterMs).toBe(toastForever);
  });

  it('stores the title only when one is given', () => {
    const queue = createToastQueue();
    queue.add({ type: 'success', message: 'merged', title: 'Import' });
    queue.add({ type: 'success', message: 'plain' });
    const [withTitle, withoutTitle] = queue.list();
    expect(withTitle?.title).toBe('Import');
    expect(withoutTitle).not.toHaveProperty('title');
  });

  it('dismiss removes only that toast', () => {
    const queue = createToastQueue();
    const first = queue.add({ type: 'info', message: 'one' });
    const second = queue.add({ type: 'info', message: 'two' });
    const third = queue.add({ type: 'info', message: 'three' });
    queue.dismiss(second);
    expect(queue.list().map((toast) => toast.id)).toEqual([first, third]);
  });

  it('ignores an unknown id and does not notify', () => {
    const queue = createToastQueue();
    queue.add({ type: 'info', message: 'one' });
    const listener = vi.fn();
    queue.subscribe(listener);
    queue.dismiss(999);
    expect(listener).not.toHaveBeenCalled();
    expect(queue.list()).toHaveLength(1);
  });

  it('dismissing the same id twice is harmless and notifies only once', () => {
    const queue = createToastQueue();
    const id = queue.add({ type: 'warning', message: 'one' });
    const listener = vi.fn();
    queue.subscribe(listener);
    queue.dismiss(id);
    queue.dismiss(id);
    expect(queue.list()).toHaveLength(0);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifies subscribers on add and on effective dismiss', () => {
    const queue = createToastQueue();
    const listener = vi.fn();
    queue.subscribe(listener);
    const id = queue.add({ type: 'danger', message: 'one' });
    expect(listener).toHaveBeenCalledTimes(1);
    queue.dismiss(id);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('stops notifying after unsubscribe, and a second unsubscribe is harmless', () => {
    const queue = createToastQueue();
    const listener = vi.fn();
    const unsubscribe = queue.subscribe(listener);
    unsubscribe();
    unsubscribe();
    queue.add({ type: 'info', message: 'one' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('does not skip other listeners when one unsubscribes itself while running', () => {
    const queue = createToastQueue();
    const other = vi.fn();
    let unsubscribeSelf: () => void = () => undefined;
    unsubscribeSelf = queue.subscribe(() => {
      unsubscribeSelf();
    });
    queue.subscribe(other);
    queue.add({ type: 'info', message: 'one' });
    expect(other).toHaveBeenCalledTimes(1);
  });

  it('list returns a copy that does not change the queue when mutated', () => {
    const queue = createToastQueue();
    queue.add({ type: 'info', message: 'one' });
    const copy = queue.list();
    copy.pop();
    const [toast] = copy;
    if (toast) {
      toast.message = 'changed';
    }
    copy.push({ id: 42, type: 'danger', message: 'extra', hideAfterMs: toastForever });
    const current = queue.list();
    expect(current).toHaveLength(1);
    expect(current[0]?.message).toBe('one');
  });

  it('keeps two toasts with equal text as two toasts', () => {
    const queue = createToastQueue();
    const first = queue.add({ type: 'danger', message: 'same' });
    const second = queue.add({ type: 'danger', message: 'same' });
    expect(first).not.toBe(second);
    expect(queue.list()).toHaveLength(2);
    queue.dismiss(first);
    expect(queue.list().map((toast) => toast.id)).toEqual([second]);
  });
});
