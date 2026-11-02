import { describe, expect, it } from 'vitest';
import { formatScore, formatScoreShort } from './format-score';

describe('formatScoreShort', () => {
  it('shows only the points', () => {
    expect(formatScoreShort([500, 0])).toBe('500 points');
    expect(formatScoreShort([620, -2])).toBe('620 points');
    expect(formatScoreShort([360, 3])).toBe('360 points');
  });
});

describe('formatScore', () => {
  it('shows points and on par for deviation 0', () => {
    expect(formatScore([500, 0])).toBe('500 points · On par');
  });

  it('shows faster than par with plural', () => {
    expect(formatScore([570, -1])).toBe('570 points · 1 move faster');
    expect(formatScore([620, -2])).toBe('620 points · 2 moves faster');
  });

  it('shows slower than par with plural', () => {
    expect(formatScore([470, 1])).toBe('470 points · 1 move slower');
    expect(formatScore([360, 3])).toBe('360 points · 3 moves slower');
  });
});
