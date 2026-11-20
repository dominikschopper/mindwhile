import type { Toast } from '@mindwhile/core';

// Auto-hide timers per toast, with pause (hover, focus) and resume with the remaining time.
export type ToastTimers = {
  sync(list: Toast[]): void;
  pause(id: number, kind: 'hovered' | 'focused'): void;
  resume(id: number, kind: 'hovered' | 'focused'): void;
  clear(): void;
};

type Entry = {
  timer: ReturnType<typeof setTimeout> | undefined;
  remaining: number;
  startedAt: number;
  hovered: boolean;
  focused: boolean;
};

export function createToastTimers(dismiss: (id: number) => void): ToastTimers {
  const entries = new Map<number, Entry>();

  function stop(entry: Entry): void {
    if (entry.timer !== undefined) {
      clearTimeout(entry.timer);
      entry.timer = undefined;
    }
  }

  function start(id: number, entry: Entry): void {
    stop(entry);
    entry.startedAt = Date.now();
    entry.timer = setTimeout(() => {
      entry.timer = undefined;
      dismiss(id);
    }, entry.remaining);
  }

  return {
    sync(list) {
      const ids = new Set(list.map((toast) => toast.id));
      for (const [id, entry] of entries) {
        if (!ids.has(id)) {
          stop(entry);
          entries.delete(id);
        }
      }
      for (const toast of list) {
        if (entries.has(toast.id)) {
          continue;
        }
        const entry: Entry = {
          timer: undefined,
          remaining: toast.hideAfterMs,
          startedAt: 0,
          hovered: false,
          focused: false,
        };
        entries.set(toast.id, entry);
        if (toast.hideAfterMs > 0) {
          start(toast.id, entry);
        }
      }
    },
    pause(id, kind) {
      const entry = entries.get(id);
      if (!entry) {
        return;
      }
      entry[kind] = true;
      if (entry.timer !== undefined) {
        stop(entry);
        entry.remaining = Math.max(0, entry.remaining - (Date.now() - entry.startedAt));
      }
    },
    resume(id, kind) {
      const entry = entries.get(id);
      if (!entry) {
        return;
      }
      entry[kind] = false;
      if (!entry.hovered && !entry.focused && entry.timer === undefined && entry.remaining > 0) {
        start(id, entry);
      }
    },
    clear() {
      for (const entry of entries.values()) {
        stop(entry);
      }
      entries.clear();
    },
  };
}

// True when focus leaves the card (not when it only moves inside it).
export type CardFocusEvent = FocusEvent;

export function focusLeftCard(event: CardFocusEvent): boolean {
  const card = event.currentTarget;
  const next = event.relatedTarget;
  return !(card instanceof Node && next instanceof Node && card.contains(next));
}
