import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { blendHex, contrastRatio, pairDeltaE, visionCases } from './color-math';
import { markOpacity, palette, paletteThemes } from './palette';

const tokens = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

const tokenPair = (name: string): [string, string] => {
  const match = new RegExp(
    `${name}:\\s*light-dark\\((#[0-9a-f]{6}),\\s*(#[0-9a-f]{6})\\)`,
    'i',
  ).exec(tokens);
  if (!match) {
    throw new Error(`Token ${name} not found`);
  }
  return [match[1]!.toLowerCase(), match[2]!.toLowerCase()];
};

const minDeltaE = (colors: readonly string[], vision: (typeof visionCases)[number]): number => {
  let min = Infinity;
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      min = Math.min(min, pairDeltaE(colors[i]!, colors[j]!, vision));
    }
  }
  return min;
};

// Normal vision needs more distance than the simulated color vision deficiencies,
// where the marks carry the rest.
const minDelta = { normal: 25, protan: 12, deutan: 12, tritan: 12 } as const;

describe('jelly-sort palette', () => {
  it('has eight colors per theme', () => {
    for (const theme of paletteThemes) {
      expect(palette[theme]).toHaveLength(8);
    }
  });

  for (const theme of paletteThemes) {
    it(`${theme}: every mark reaches contrast 3:1 on its color with markOpacity applied`, () => {
      for (const entry of palette[theme]) {
        const blended = blendHex(entry.mark, entry.color, markOpacity);
        expect(contrastRatio(entry.color, blended)).toBeGreaterThanOrEqual(3);
      }
    });

    for (const vision of visionCases) {
      it(`${theme}/${vision}: all 28 pairs differ by delta E 76 of at least ${minDelta[vision]}`, () => {
        const colors = palette[theme].map((entry) => entry.color);
        expect(minDeltaE(colors, vision)).toBeGreaterThanOrEqual(minDelta[vision]);
      });
    }
  }

  it('markOpacity equals --jelly-mark-opacity in tokens.css', () => {
    const match = /--jelly-mark-opacity:\s*([0-9.]+)\s*;/.exec(tokens);
    if (!match) {
      throw new Error('Token --jelly-mark-opacity not found');
    }
    expect(Number(match[1])).toBe(markOpacity);
  });

  it('tokens.css carries the hex values of palette.ts', () => {
    for (let index = 0; index < 8; index++) {
      const [colorLight, colorDark] = tokenPair(`--jelly-${index}`);
      const [markLight, markDark] = tokenPair(`--jelly-mark-${index}`);
      expect(colorLight).toBe(palette.light[index]!.color);
      expect(colorDark).toBe(palette.dark[index]!.color);
      expect(markLight).toBe(palette.light[index]!.mark);
      expect(markDark).toBe(palette.dark[index]!.mark);
    }
  });
});
