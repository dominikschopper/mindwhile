/** How long the flow and merge animation stay marked on a tray, in milliseconds. */
export const LANDING_MS = 450;

/** The poured block as it lands in the target tray. */
export interface Landing {
  /** The target tray. */
  tray: number;
  /** Number of layers that moved, counted from the top of the target. */
  moved: number;
  /** True when the block landed on a layer of the same color. */
  merged: boolean;
  /** Offset in px from where the block came from to where it is now (FLIP "invert"). */
  x: number;
  y: number;
  /** Changes on every landing so a repeated landing restarts the animation. */
  key: number;
}

/** True when the user asked for less motion. Read on every call, never cached. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** What a pour did, derived from the two trays before it and the source length after it. */
export function describePour(
  sourceBefore: readonly number[],
  targetBefore: readonly number[],
  sourceLengthAfter: number,
): { moved: number; merged: boolean } {
  const moved = sourceBefore.length - sourceLengthAfter;
  const color = sourceBefore[sourceBefore.length - 1];
  const merged =
    moved > 0 && targetBefore.length > 0 && targetBefore[targetBefore.length - 1] === color;
  return { moved, merged };
}

/** Offset that moves the landed block back to where the source tray is (FLIP "invert"). */
export function flowOffset(
  source: { left: number; top: number },
  target: { left: number; top: number },
): { x: number; y: number } {
  return { x: source.left - target.left, y: source.top - target.top };
}

/** Finds the tray buttons of a view and measures the offset from the source to the target. */
export function measureFlow(
  root: unknown,
  from: number,
  to: number,
): { x: number; y: number } | null {
  if (!(root instanceof Element)) {
    return null;
  }
  const glasses = root.querySelectorAll('.tray-glass');
  const source = glasses[from];
  const target = glasses[to];
  if (!source || !target) {
    return null;
  }
  return flowOffset(source.getBoundingClientRect(), target.getBoundingClientRect());
}

/**
 * Runs `clear` after the landing time and returns a function that cancels it.
 * One landing at a time, a new one replaces the pending one.
 */
export function createLandingTimer(clear: () => void) {
  let handle: ReturnType<typeof setTimeout> | undefined;
  function cancel(): void {
    if (handle !== undefined) {
      clearTimeout(handle);
      handle = undefined;
    }
  }
  return {
    start(): void {
      cancel();
      handle = setTimeout(() => {
        handle = undefined;
        clear();
      }, LANDING_MS);
    },
    cancel,
  };
}
