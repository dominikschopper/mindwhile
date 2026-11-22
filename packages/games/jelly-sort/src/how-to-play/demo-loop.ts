import { pour, type Board } from '../common/board/board';
import { landingDuration } from '../play/animation';

/** The phases of the demo loop, in order. */
export type DemoStepId = 'start' | 'select' | 'pour';

export interface DemoStep {
  id: DemoStepId;
  /** How long the step stays, in milliseconds. */
  ms: number;
}

/** Pause before the pick, time with the block selected, and the pour with a pause to look. */
export const DEMO_STEPS: readonly DemoStep[] = [
  { id: 'start', ms: 1200 },
  { id: 'select', ms: 1600 },
  { id: 'pour', ms: landingDuration(true) + 1400 },
];

/** Demo board: tray 0 holds two equal layers on top of another color, tray 1 has the same color on top. */
export const DEMO_CAPACITY = 4;
export const DEMO_START: Board = {
  capacity: DEMO_CAPACITY,
  trays: [
    [1, 0, 0],
    [2, 0],
    [2, 1],
  ],
};
/** Pour the top block of the first tray onto the second one. */
export const DEMO_FROM = 0;
export const DEMO_TO = 1;
export const DEMO_END: Board = pour(DEMO_START, DEMO_FROM, DEMO_TO);

/**
 * Plays a list of steps again and again. `onStep` gets the id of each step as it begins (the first
 * one at once on `start`). `stop` clears the pending timer, `start` restarts from the first step.
 */
export function createStepPlayer(steps: readonly DemoStep[], onStep: (id: DemoStepId) => void) {
  let handle: ReturnType<typeof setTimeout> | undefined;
  let running = false;

  function play(index: number): void {
    const step = steps[index % steps.length]!;
    onStep(step.id);
    handle = setTimeout(() => {
      if (running) {
        play(index + 1);
      }
    }, step.ms);
  }

  function stop(): void {
    running = false;
    if (handle !== undefined) {
      clearTimeout(handle);
      handle = undefined;
    }
  }

  return {
    start(): void {
      stop();
      if (steps.length === 0) {
        return;
      }
      running = true;
      play(0);
    },
    stop,
  };
}
