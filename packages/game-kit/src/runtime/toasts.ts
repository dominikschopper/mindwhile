import type { ToastQueue } from '@mindwhile/core';
import { inject, provide, type InjectionKey } from 'vue';

// Exported for tests only, not from the package index. Symbol.for keeps the key
// identical even if game-kit ends up twice in a bundle.
export const toastsKey = Symbol.for('mindwhile.toasts') as InjectionKey<ToastQueue>;

export function provideToasts(queue: ToastQueue): void {
  provide(toastsKey, queue);
}

export function useToastQueue(): ToastQueue | undefined {
  return inject(toastsKey, undefined);
}
