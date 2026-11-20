export const toastTypes = ['info', 'success', 'warning', 'danger'] as const;
export type ToastType = (typeof toastTypes)[number];

export type Toast = {
  id: number;
  type: ToastType;
  message: string;
  title?: string;
  // Resolved value: 0 means the toast stays until it is dismissed.
  hideAfterMs: number;
};

export type ToastInput = {
  type: ToastType;
  message: string;
  title?: string;
  hideAfterMs?: number;
};

export type ToastQueue = {
  add(input: ToastInput): number;
  dismiss(id: number): void;
  list(): Toast[];
  subscribe(listener: () => void): () => void;
};

/** `hideAfterMs` value for a toast that stays until it is dismissed. */
export const toastForever = 0;

/** Default time until a toast hides itself, per type. The one place for these numbers. */
export const toastTimeouts = {
  info: 5000,
  success: 5000,
  warning: toastForever,
  danger: toastForever,
} as const satisfies Record<ToastType, number>;

export function defaultHideAfterMs(type: ToastType): number {
  return toastTimeouts[type];
}

export function createToastQueue(): ToastQueue {
  let toasts: Toast[] = [];
  let lastId = 0;
  const listeners = new Set<() => void>();

  function notify(): void {
    // Iterate over a copy, so a listener may unsubscribe while it runs.
    for (const listener of [...listeners]) {
      listener();
    }
  }

  return {
    add(input) {
      lastId += 1;
      const toast: Toast = {
        id: lastId,
        type: input.type,
        message: input.message,
        hideAfterMs:
          typeof input.hideAfterMs === 'number'
            ? input.hideAfterMs
            : defaultHideAfterMs(input.type),
      };
      if (input.title !== undefined) {
        toast.title = input.title;
      }
      toasts = [...toasts, toast];
      notify();
      return toast.id;
    },
    dismiss(id) {
      if (!toasts.some((toast) => toast.id === id)) {
        return;
      }
      toasts = toasts.filter((toast) => toast.id !== id);
      notify();
    },
    list() {
      return toasts.map((toast) => ({ ...toast }));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
