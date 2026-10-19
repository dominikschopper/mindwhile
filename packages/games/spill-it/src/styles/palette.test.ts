import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrastRatio, pairDeltaE, visionCases } from './color-math'
import { palette, paletteThemes } from './palette'

const tokens = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

const tokenPair = (name: string): [string, string] => {
  const match = new RegExp(
    `${name}:\\s*light-dark\\((#[0-9a-f]{6}),\\s*(#[0-9a-f]{6})\\)`,
    'i',
  ).exec(tokens)
  if (!match) throw new Error(`Token ${name} not found`)
  return [match[1]!.toLowerCase(), match[2]!.toLowerCase()]
}

const minDeltaE = (colors: readonly string[], vision: (typeof visionCases)[number]): number => {
  let min = Infinity
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      min = Math.min(min, pairDeltaE(colors[i]!, colors[j]!, vision))
    }
  }
  return min
}

describe('spill-it palette', () => {
  it('has six colors per theme', () => {
    for (const theme of paletteThemes) expect(palette[theme]).toHaveLength(6)
  })

  for (const theme of paletteThemes) {
    it(`${theme}: every mark reaches contrast 4.5:1 on its color`, () => {
      for (const entry of palette[theme]) {
        expect(contrastRatio(entry.color, entry.mark)).toBeGreaterThanOrEqual(4.5)
      }
    })

    for (const vision of visionCases) {
      it(`${theme}/${vision}: all 15 pairs differ by delta E 76 of at least 20`, () => {
        const colors = palette[theme].map((entry) => entry.color)
        const min = minDeltaE(colors, vision)
        console.info(`lowest delta E ${theme}/${vision}: ${min.toFixed(2)}`)
        expect(min).toBeGreaterThanOrEqual(20)
      })
    }
  }

  it('tokens.css carries the hex values of palette.ts', () => {
    for (let index = 0; index < 6; index++) {
      const [colorLight, colorDark] = tokenPair(`--spill-it-color-${index}`)
      const [markLight, markDark] = tokenPair(`--spill-it-mark-${index}`)
      expect(colorLight).toBe(palette.light[index]!.color)
      expect(colorDark).toBe(palette.dark[index]!.color)
      expect(markLight).toBe(palette.light[index]!.mark)
      expect(markDark).toBe(palette.dark[index]!.mark)
    }
  })
})
