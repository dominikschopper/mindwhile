import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canPour, isSolved, topBlock } from '../common/board/board';
import { landingDuration } from '../play/animation';
import {
  createStepPlayer,
  DEMO_END,
  DEMO_FROM,
  DEMO_START,
  DEMO_STEPS,
  DEMO_TO,
  type DemoStepId,
} from './demo-loop';

describe('demo board', () => {
  it('is a legal pour of a block of two onto the same color', () => {
    expect(canPour(DEMO_START, DEMO_FROM, DEMO_TO)).toBe(true);
    expect(topBlock(DEMO_START.trays[DEMO_FROM]!)?.length).toBe(2);
    expect(topBlock(DEMO_START.trays[DEMO_FROM]!)?.color).toBe(
      topBlock(DEMO_START.trays[DEMO_TO]!)?.color,
    );
    expect(DEMO_END.trays[DEMO_TO]).toHaveLength(4);
  });

  it('gives the pour step room for the whole landing', () => {
    const pour = DEMO_STEPS.find((step) => step.id === 'pour')!;
    expect(pour.ms).toBeGreaterThan(landingDuration(true));
  });
});

describe('createStepPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs start, select, pour in order and loops', () => {
    const seen: DemoStepId[] = [];
    const player = createStepPlayer(DEMO_STEPS, (id) => seen.push(id));
    player.start();
    expect(seen).toEqual(['start']);
    for (const step of DEMO_STEPS) {
      vi.advanceTimersByTime(step.ms);
    }
    expect(seen).toEqual(['start', 'select', 'pour', 'start']);
    vi.advanceTimersByTime(DEMO_STEPS[0]!.ms);
    expect(seen.at(-1)).toBe('select');
    player.stop();
  });

  it('stops and leaves no timer behind', () => {
    const seen: DemoStepId[] = [];
    const player = createStepPlayer(DEMO_STEPS, (id) => seen.push(id));
    player.start();
    player.stop();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(60000);
    expect(seen).toEqual(['start']);
  });

  it('restarts from the first step', () => {
    const seen: DemoStepId[] = [];
    const player = createStepPlayer(DEMO_STEPS, (id) => seen.push(id));
    player.start();
    vi.advanceTimersByTime(DEMO_STEPS[0]!.ms);
    player.start();
    expect(seen).toEqual(['start', 'select', 'start']);
    expect(vi.getTimerCount()).toBe(1);
    player.stop();
  });

  it('is not a won board at the start', () => {
    expect(isSolved(DEMO_START)).toBe(false);
  });
});
