import type { ToastInput, ToastType } from '@mindwhile/core';
import { useToastQueue } from '../runtime/toasts';

export interface ToastHandle {
  id: number;
  dismiss(): void;
}

export interface UseToast {
  showToast(type: ToastType, message: string, title?: string, hideAfterMs?: number): ToastHandle;
}

const inactiveHandle: ToastHandle = { id: -1, dismiss() {} };

export function useToast(): UseToast {
  const queue = useToastQueue();

  return {
    showToast(type, message, title, hideAfterMs) {
      if (!queue) {
        return { ...inactiveHandle };
      }
      const input: ToastInput = { type, message };
      if (title !== undefined) {
        input.title = title;
      }
      if (hideAfterMs !== undefined) {
        input.hideAfterMs = hideAfterMs;
      }
      const id = queue.add(input);
      return {
        id,
        dismiss() {
          queue.dismiss(id);
        },
      };
    },
  };
}
