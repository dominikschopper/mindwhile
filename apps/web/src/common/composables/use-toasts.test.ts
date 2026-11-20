import { toastForever, toastTimeouts } from '@mindwhile/core';
import { afterEach, describe, expect, it } from 'vitest';
import { resetToastsForTests, showToast, toastQueue } from './use-toasts';

describe('use-toasts', () => {
  afterEach(() => {
    resetToastsForTests();
  });

  it('adds a toast to the shared queue with the default timeout', () => {
    const handle = showToast('info', 'Hello', 'Title');
    expect(toastQueue.list()).toEqual([
      {
        id: handle.id,
        type: 'info',
        message: 'Hello',
        title: 'Title',
        hideAfterMs: toastTimeouts.info,
      },
    ]);
  });

  it('passes an explicit timeout through', () => {
    showToast('danger', 'Oops', undefined, toastTimeouts.info);
    showToast('info', 'Stay', undefined, toastForever);
    expect(toastQueue.list().map((toast) => toast.hideAfterMs)).toEqual([
      toastTimeouts.info,
      toastForever,
    ]);
  });

  it('returns a handle that dismisses only its toast', () => {
    const first = showToast('success', 'One');
    const second = showToast('warning', 'Two');
    first.dismiss();
    expect(toastQueue.list().map((toast) => toast.id)).toEqual([second.id]);
  });

  it('resets the queue for tests', () => {
    showToast('info', 'One');
    resetToastsForTests();
    expect(toastQueue.list()).toEqual([]);
  });
});
