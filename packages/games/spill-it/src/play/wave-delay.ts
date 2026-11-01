/** Delay per diagonal step (row + column) of the wave, in milliseconds. */
export const STEP_MS = 30;

/** Upper bound of the delay, in milliseconds. */
export const MAX_DELAY_MS = 600;

/** Delay in milliseconds for the cell at `index` of a `size` x `size` board. */
export function waveDelayMs(index: number, size: number): number {
  const row = Math.floor(index / size);
  const column = index % size;
  return Math.min((row + column) * STEP_MS, MAX_DELAY_MS);
}
