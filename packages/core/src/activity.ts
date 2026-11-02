export interface ActivitySignal {
  isActive(): boolean;
  set(active: boolean): void;
  subscribe(listener: (active: boolean) => void): () => void;
}

export function createActivitySignal(initial = true): ActivitySignal {
  let active = initial;
  const listeners = new Set<(active: boolean) => void>();

  return {
    isActive: () => active,
    set(next) {
      if (next === active) {
        return;
      }
      active = next;
      // Iterate over a copy, so a listener may unsubscribe while it runs.
      for (const listener of [...listeners]) {
        listener(next);
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
