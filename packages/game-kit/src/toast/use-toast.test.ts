// @vitest-environment happy-dom
import { createToastQueue, toastTimeouts, type ToastQueue } from '@mindwhile/core';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import * as index from '../index';
import { toastsKey, provideToasts } from '../runtime/toasts';
import { useToast, type UseToast } from './use-toast';

function capture(): { api: () => UseToast; Comp: ReturnType<typeof defineComponent> } {
  let got: UseToast | undefined;
  const Comp = defineComponent({
    setup() {
      got = useToast();
      return () => h('div');
    },
  });
  return { api: () => got!, Comp };
}

function withQueue(queue: ToastQueue, child: ReturnType<typeof defineComponent>) {
  return defineComponent({
    setup() {
      provideToasts(queue);
      return () => h(child);
    },
  });
}

describe('toast key and exports', () => {
  it('is a Symbol.for symbol and not exported from the package index', () => {
    expect(Symbol.keyFor(toastsKey as symbol)).toBe('mindwhile.toasts');
    expect(index).not.toHaveProperty('toastsKey');
  });

  it('exports provideToasts and useToast from the package index', () => {
    expect(index).toHaveProperty('provideToasts');
    expect(index).toHaveProperty('useToast');
  });
});

describe('useToast with a provided queue', () => {
  it('adds a toast with the given fields', () => {
    const queue = createToastQueue();
    const c = capture();
    mount(withQueue(queue, c.Comp));
    c.api().showToast('warning', 'Careful', 'Heads up', 3000);
    expect(queue.list()).toEqual([
      { id: 1, type: 'warning', message: 'Careful', title: 'Heads up', hideAfterMs: 3000 },
    ]);
  });

  it('applies the queue defaults when title and hideAfterMs are omitted', () => {
    const queue = createToastQueue();
    const c = capture();
    mount(withQueue(queue, c.Comp));
    c.api().showToast('info', 'Hello');
    const [toast] = queue.list();
    expect(toast).toMatchObject({
      type: 'info',
      message: 'Hello',
      hideAfterMs: toastTimeouts.info,
    });
    expect(toast).not.toHaveProperty('title');
  });

  it('returns a handle whose id matches the toast and whose dismiss removes exactly that toast', () => {
    const queue = createToastQueue();
    const c = capture();
    mount(withQueue(queue, c.Comp));
    const first = c.api().showToast('danger', 'one');
    const second = c.api().showToast('danger', 'two');
    expect(first.id).toBe(1);
    expect(second.id).toBe(2);
    first.dismiss();
    expect(queue.list().map((toast) => toast.id)).toEqual([2]);
  });

  it('dismissing twice is harmless', () => {
    const queue = createToastQueue();
    const c = capture();
    mount(withQueue(queue, c.Comp));
    const keep = c.api().showToast('success', 'keep');
    const gone = c.api().showToast('success', 'gone');
    gone.dismiss();
    expect(() => gone.dismiss()).not.toThrow();
    expect(queue.list().map((toast) => toast.id)).toEqual([keep.id]);
  });
});

describe('useToast without a provider', () => {
  it('does nothing and does not throw', () => {
    const c = capture();
    mount(c.Comp);
    let handle: ReturnType<UseToast['showToast']> | undefined;
    expect(() => {
      handle = c.api().showToast('info', 'nobody listens');
    }).not.toThrow();
    expect(handle).toEqual({ id: -1, dismiss: expect.any(Function) });
    expect(() => handle!.dismiss()).not.toThrow();
  });
});
