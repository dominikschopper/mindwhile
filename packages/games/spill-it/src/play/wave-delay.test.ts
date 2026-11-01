import { describe, expect, it } from 'vitest';
import { MAX_DELAY_MS, STEP_MS, waveDelayMs } from './wave-delay';

describe('waveDelayMs', () => {
  it('starts the wave at the top left cell without delay', () => {
    expect(waveDelayMs(0, 5)).toBe(0);
  });

  it('adds one step per row and per column', () => {
    expect(waveDelayMs(1, 5)).toBe(30);
    expect(waveDelayMs(5, 5)).toBe(30);
    expect(waveDelayMs(7, 5)).toBe(90);
  });

  it('caps the delay at the maximum', () => {
    expect(waveDelayMs(195, 14)).toBe(600);
    expect(waveDelayMs(195, 14)).toBe(MAX_DELAY_MS);
  });

  it('keeps every cell between 0 and the maximum', () => {
    for (const size of [4, 14]) {
      for (let index = 0; index < size * size; index++) {
        const delay = waveDelayMs(index, size);
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).toBeLessThanOrEqual(MAX_DELAY_MS);
      }
    }
  });

  it('uses the step constant', () => {
    expect(waveDelayMs(1, 5)).toBe(STEP_MS);
  });
});
