import { describe, expect, it } from 'vitest';
import {
  MAX_WAVES,
  WALL_AIR,
  pointsPerWall,
  wobbleFor,
  wobbleFrames,
  wobbleKeyframes,
  wobbleKinds,
  wobbleStyleSheet,
  wobbleVariants,
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

function signChanges(values: number[]): number {
  const signs = values.filter((v) => Math.abs(v) > 1e-9).map((v) => Math.sign(v));
  return signs.filter((s, i) => i > 0 && s !== signs[i - 1]).length;
}

describe('wobbleFor', () => {
  it.each(cases)('gives a block of %i layers kind %i with %i waves', (layers, kind, waves) => {
    expect(wobbleFor(layers)).toEqual({ kind, waves });
  });
});

describe.each(cases)('keyframes for %i layers', (layers, kind, waves) => {
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
      // The corners stay in place.
      expect(frame.left[0]).toBe(0);
      expect(frame.right[frame.right.length - 1]).toBe(0);
    }
  });

  it('ripples: a wall moves in opposite directions along its height', () => {
    for (let i = 0; i < frames.length - 1; i++) {
      const delta = frames[i]!.left.map((v, j) => frames[i + 1]!.left[j]! - v);
      // Two sign changes per wave, the damped corners and the sampling may hide two.
      expect(signChanges(delta)).toBeGreaterThanOrEqual(Math.max(1, 2 * waves - 2));
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

describe('waves', () => {
  it('more layers give more sign changes along the wall', () => {
    const changes = [1, 3, 5].map((waves) => {
      const [a, b] = wobbleFrames(3, waves);
      return signChanges(a!.left.map((v, j) => b!.left[j]! - v));
    });
    expect(changes[0]).toBeLessThan(changes[1]!);
    expect(changes[1]).toBeLessThan(changes[2]!);
  });

  it('shifts the right wall against the left one for kind 2', () => {
    const frame = wobbleFrames(2, 2)[0]!;
    expect(frame.left).not.toEqual(frame.right);
  });

  it('fades the aftershock of kind 3', () => {
    const frames = wobbleFrames(3, 3);
    const peak = (i: number): number => Math.max(...frames[i]!.left);
    expect(peak(5)).toBeLessThan(peak(1));
  });
});

describe.each(cases)('anchored keyframes for %i layers', (_layers, kind, waves) => {
  const frames = wobbleFrames(kind, waves, true);
  const plain = wobbleFrames(kind, waves);

  it('keeps the bottom edge and the lower half fixed', () => {
    for (const frame of frames) {
      const n = frame.left.length;
      expect(frame.scaleX).toBe(1);
      expect(frame.lift).toBe(0);
      expect(frame.scaleY).toBeGreaterThanOrEqual(1);
      expect(frame.left[n - 1]).toBe(0);
      expect(frame.right[n - 1]).toBe(0);
      for (let j = 0; j < n; j++) {
        if (j / (n - 1) >= 0.99) {
          expect(frame.left[j]).toBeLessThan(1e-3);
          expect(frame.right[j]).toBeLessThan(1e-3);
        }
      }
    }
  });

  it('deforms the upper half like the plain wobble and loops', () => {
    const n = frames[0]!.left.length;
    const top = Math.floor((n - 1) / 2);
    expect(frames.some((f, i) => f.left[top]! > 0 && f.left[top] === plain[i]!.left[top])).toBe(
      true,
    );
    const { percent: a, ...first } = frames[0]!;
    const { percent: b, ...last } = frames[frames.length - 1]!;
    expect([a, b]).toEqual([0, 100]);
    expect(last).toEqual(first);
  });

  it('leaves the numbers of the plain wobble alone', () => {
    expect(plain.some((f) => f.scaleX > 1)).toBe(true);
    expect(plain.some((f) => f.lift > 0)).toBe(true);
  });
});

describe('CSS text', () => {
  it.each(cases)('is valid for %i layers', (layers, kind, waves) => {
    const css = wobbleKeyframes(kind, waves);
    expect(css.split('{').length).toBe(css.split('}').length);
    const steps = wobbleKinds[kind].steps;
    for (let i = 0; i <= steps; i++) {
      const percent = (i / steps) * 100;
      expect(css).toContain(`  ${percent}% {`);
    }
    expect(css).toContain(`@keyframes jelly-wobble-${kind}-${waves}`);
    expect(css).toContain(`@keyframes jelly-ring-${kind}-${waves}`);
    expect(css).not.toContain('NaN');
    expect(css).not.toContain('undefined');
  });

  it('starts and ends with the same keyframe', () => {
    const css = wobbleKeyframes(3, 3);
    const body = (percent: string): string => {
      const start = css.indexOf(`  ${percent}% {`);
      return css.slice(start + percent.length + 5, css.indexOf('\n  }', start));
    };
    expect(body('100')).toBe(body('0'));
  });

  it('is deterministic', () => {
    expect(wobbleKeyframes(3, 4)).toBe(wobbleKeyframes(3, 4));
    expect(wobbleStyleSheet()).toBe(wobbleStyleSheet());
  });

  it('builds one style sheet in the components layer with every variant', () => {
    const css = wobbleStyleSheet();
    expect(css.startsWith('@layer components {')).toBe(true);
    expect(css.split('{').length).toBe(css.split('}').length);
    for (const { kind, waves } of wobbleVariants()) {
      expect(css).toContain(`@keyframes jelly-wobble-${kind}-${waves} `);
      expect(css).toContain(
        `.tray-glass__block--wobble-${kind}.tray-glass__block--waves-${waves}::after`,
      );
    }
    expect(wobbleVariants()).toHaveLength(5);
  });
});
