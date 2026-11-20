import {
  createToastQueue,
  type ToastInput,
  type ToastQueue,
  type ToastType,
} from '@mindwhile/core';
import type { ToastHandle } from '@mindwhile/game-kit';

/** The one toast queue of the platform. `App.vue` provides it to the game-kit toast host. */
export const toastQueue: ToastQueue = createToastQueue();

export function showToast(
  type: ToastType,
  message: string,
  title?: string,
  hideAfterMs?: number,
): ToastHandle {
  const input: ToastInput = { type, message };
  if (title !== undefined) {
    input.title = title;
  }
  if (hideAfterMs !== undefined) {
    input.hideAfterMs = hideAfterMs;
  }
  const id = toastQueue.add(input);
  return {
    id,
    dismiss() {
      toastQueue.dismiss(id);
    },
  };
}

/** For tests only: dismisses every toast, so the shared queue is empty again. */
export function resetToastsForTests(): void {
  for (const toast of toastQueue.list()) {
    toastQueue.dismiss(toast.id);
  }
}
