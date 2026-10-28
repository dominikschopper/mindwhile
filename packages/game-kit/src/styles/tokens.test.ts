import { expect, it } from 'vitest'

import { contrast, readPalette, readStyle, resolveLightDark } from './color.test-helpers.ts'

const css = readStyle('./tokens.css')

const roles = [
  'text',
  'surface',
  'surface-raised',
  'border',
  'accent',
  'success',
  'warning',
  'on-warning',
  'danger',
  'focus-ring',
  'on-accent',
  'on-success',
  'on-danger',
  'link',
  'chrome-surface',
  'on-chrome',
  'chrome-accent',
  'chrome-focus-ring',
] as const

const palette = readPalette(css)

const resolve = (role: string, theme: 0 | 1): string =>
  resolveLightDark(css, palette, `--${role}-color`, theme)

const pairs = [
  ['text', 'surface'],
  ['text', 'surface-raised'],
  ['accent', 'surface'],
  ['danger', 'surface'],
  ['success', 'surface'],
  ['warning', 'surface'],
  ['warning', 'surface-raised'],
  ['on-warning', 'warning'],
  ['on-accent', 'accent'],
  ['on-success', 'success'],
  ['on-danger', 'danger'],
  ['on-chrome', 'chrome-surface'],
  ['link', 'surface'],
  ['chrome-accent', 'chrome-surface'],
  ['chrome-focus-ring', 'chrome-surface'],
] as const

it('defines every role token with light-dark()', () => {
  for (const role of roles) {
    expect(css).toMatch(new RegExp(`--${role}-color:\\s*light-dark\\(`))
  }
})

it('reaches 4.5:1 for the role pairs in light and dark', () => {
  const lowest = { light: Infinity, dark: Infinity }
  for (const [theme, index] of [
    ['light', 0],
    ['dark', 1],
  ] as const) {
    for (const [fg, bg] of pairs) {
      const ratio = contrast(resolve(fg, index), resolve(bg, index))
      lowest[theme] = Math.min(lowest[theme], ratio)
      expect(ratio, `${fg}/${bg} (${theme}) = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
    }
  }
  console.log('lowest contrast', lowest)
})
