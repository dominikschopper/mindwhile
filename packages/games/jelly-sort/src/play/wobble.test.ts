import { describe, expect, it } from 'vitest';
import {
  MAX_WAVES,
  WALL_AIR,
  pointsPerWall,
  wobbleFor,
  wobbleFrames,
  wobbleKinds,
  type WobbleKindId,
} from './wobble';

const cases: [layers: number, kind: WobbleKindId, waves: number][] = [
  [1, 1, 1],
  [2, 2, 2],
  [3, 3, 3],
  [4, 3, 4],
  [5, 3, 5],
  [6, 3, 5],
  [12, 3, MAX_WAVES],
];

describe('wobbleFor', () => {
  it.each(cases)('gives a block of %i layers kind %i with %i waves', (layers, kind, waves) => {
    expect(wobbleFor(layers)).toEqual({ kind, waves });
  });
});

describe.each(cases)('keyframes for %i layers', (_layers, kind, waves) => {
  const frames = wobbleFrames(kind, waves);

  it('has the same point count in every keyframe', () => {
    const n = pointsPerWall(waves);
    for (const frame of frames) {
      expect(frame.left).toHaveLength(n);
      expect(frame.right).toHaveLength(n);
    }
  });

  it('keeps every offset inside the block and the bulge below the wall air', () => {
    const { pinch, bulge } = wobbleKinds[kind];
    expect(bulge / 2).toBeLessThan(WALL_AIR);
    for (const frame of frames) {
      expect(frame.scaleX).toBeLessThanOrEqual(1 + bulge);
      for (const offset of [...frame.left, ...frame.right]) {
        expect(offset).toBeGreaterThanOrEqual(0);
        expect(offset).toBeLessThanOrEqual(pinch);
      }
    }
  });

  it('loops seamlessly', () => {
    const { percent: firstPercent, ...first } = frames[0]!;
    const { percent: lastPercent, ...last } = frames[frames.length - 1]!;
    expect(firstPercent).toBe(0);
    expect(lastPercent).toBe(100);
    expect(last).toEqual(first);
  });
});
