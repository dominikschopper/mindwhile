import { gameColors } from '@mindwhile/core'
import { expect, it } from 'vitest'
import { contrast, readPalette, readStyle, resolveLightDark } from './color.test-helpers.ts'

const tokens = readStyle('./tokens.css')
const css = readStyle('./game-colors.css')
const palette = readPalette(tokens)

const classBlocks = [...css.matchAll(/\.game-color-([a-z0-9-]+)\s*\{([^}]*)\}/g)].map((m) => ({
  name: m[1]!,
  body: m[2]!,
}))

const surfaces = (theme: 0 | 1) => [
  resolveLightDark(tokens, palette, '--surface-color', theme),
  resolveLightDark(tokens, palette, '--surface-raised-color', theme),
]

it('has a class for every game color', () => {
  const names = classBlocks.map((b) => b.name)
  for (const name of gameColors) expect(names, `missing .game-color-${name}`).toContain(name)
})

it('has no class for a name outside the list', () => {
  for (const { name } of classBlocks) {
    expect(gameColors as readonly string[], `unknown .game-color-${name}`).toContain(name)
  }
})

it('sets only custom properties in the color classes', () => {
  for (const { name, body } of classBlocks) {
    const props = [...body.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]!)
    expect(props.sort(), `.game-color-${name}`).toEqual(['--game-color', '--on-game-color'])
  }
})

it('reaches 4.5:1 for fill and text in light and dark', () => {
  for (const name of gameColors) {
    const block = classBlocks.find((b) => b.name === name)!.body
    for (const theme of [0, 1] as const) {
      const fill = resolveLightDark(block, palette, '--game-color', theme)
      const on = resolveLightDark(block, palette, '--on-game-color', theme)
      for (const surface of surfaces(theme)) {
        const ratio = contrast(fill, surface)
        expect(
          ratio,
          `${name} fill/surface (${theme}) = ${ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(4.5)
      }
      const onRatio = contrast(on, fill)
      expect(onRatio, `${name} on/fill (${theme}) = ${onRatio.toFixed(2)}`).toBeGreaterThanOrEqual(
        4.5,
      )
    }
  }
})

it('defines the three helpers using only the game variables', () => {
  const helpers = {
    'text-game': /color:\s*var\(--game-color\)/,
    'bg-game': /background-color:\s*var\(--game-color\);\s*color:\s*var\(--on-game-color\)/,
    'border-game': /border-color:\s*var\(--game-color\)/,
  }
  for (const [name, pattern] of Object.entries(helpers)) {
    const m = new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`).exec(css)
    expect(m, `.${name} missing`).not.toBeNull()
    expect(m![1]).toMatch(pattern)
    expect(m![1]).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    const vars = [...m![1]!.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((v) => v[1])
    for (const v of vars) expect(['--game-color', '--on-game-color']).toContain(v)
  }
})
