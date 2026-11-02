import type { ActivitySignal } from './activity';

export interface Clock {
  elapsedMs(): number;
}

export interface ActiveClock extends Clock {
  serialize(): { elapsedMs: number };
  pause(): void;
  resume(): void;
  isRunning(): boolean;
  subscribe(listener: (running: boolean) => void): () => void;
  stop(): void;
}

export interface ActiveClockOptions {
  activity: ActivitySignal;
  now?: () => number;
  saved?: unknown;
}

function readSaved(saved: unknown): number {
  if (typeof saved !== 'object' || saved === null) {
    return 0;
  }
  const value = (saved as { elapsedMs?: unknown }).elapsedMs;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

export function createActiveClock(options: ActiveClockOptions): ActiveClock {
  const { activity } = options;
  const rawNow = options.now ?? (() => performance.now());
  // A clock that goes backwards must not lose time already counted: clamp to the highest value seen.
  let latest = Number.NEGATIVE_INFINITY;
  const now = (): number => {
    const value = rawNow();
    if (Number.isFinite(value) && value > latest) {
      latest = value;
    }
    return latest;
  };

  let total = readSaved(options.saved);
  let paused = false;
  let stopped = false;
  let running = false;
  let runStart = 0;
  const listeners = new Set<(running: boolean) => void>();

  function stretch(): number {
    const delta = now() - runStart;
    return Number.isFinite(delta) && delta > 0 ? delta : 0;
  }

  function update(): void {
    const shouldRun = !stopped && !paused && activity.isActive();
    if (shouldRun === running) {
      return;
    }
    if (shouldRun) {
      runStart = now();
    } else {
      total += stretch();
    }
    running = shouldRun;
    // Iterate over a copy, so a listener may unsubscribe while it runs.
    for (const listener of [...listeners]) {
      listener(running);
    }
  }

  const unsubscribeActivity = activity.subscribe(update);
  update();

  return {
    elapsedMs: () => (running ? total + stretch() : total),
    serialize() {
      return { elapsedMs: running ? total + stretch() : total };
    },
    pause() {
      paused = true;
      update();
    },
    resume() {
      paused = false;
      update();
    },
    isRunning: () => running,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    stop() {
      if (stopped) {
        return;
      }
      stopped = true;
      unsubscribeActivity();
      update();
    },
  };
}
