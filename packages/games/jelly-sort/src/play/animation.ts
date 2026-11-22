/**
 * Durations of the landing phases in milliseconds. The same numbers are the CSS custom properties
 * `--landing-flow-ms`, `--landing-hover-ms` and `--landing-merge-ms` in TrayGlass.css, keep both
 * in step.
 */
export const LANDING_TIMING = { flow: 420, hover: 600, merge: 100 } as const;

/** The phases of a landing: flow to the hover spot, hover and wobble, merge into one layer. */
export type LandingPhase = 'flow' | 'hover' | 'merge';

/** Total time of a landing, with or without hover and merge. */
export function landingDuration(hover: boolean): number {
  const { flow, hover: hovering, merge } = LANDING_TIMING;
  return hover ? flow + hovering + merge : flow;
}

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
  /** Where the landing is now. */
  phase: LandingPhase;
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
 * Steps through the phases of one landing with timers. `onPhase` gets each new phase and null when
 * the landing is over (the first phase, flow, is the one the caller starts with). Without a hover
 * (empty or different target) the landing is flow only. One landing at a time, `start` replaces
 * the pending one, `cancel` stops it.
 */
export function createLandingTimer(onPhase: (phase: LandingPhase | null) => void) {
  let handles: ReturnType<typeof setTimeout>[] = [];
  function cancel(): void {
    for (const handle of handles) {
      clearTimeout(handle);
    }
    handles = [];
  }
  return {
    start(hover: boolean): void {
      cancel();
      const { flow, hover: hovering } = LANDING_TIMING;
      if (hover) {
        handles.push(setTimeout(() => onPhase('hover'), flow));
        handles.push(setTimeout(() => onPhase('merge'), flow + hovering));
      }
      handles.push(setTimeout(() => onPhase(null), landingDuration(hover)));
    },
    cancel,
  };
}
