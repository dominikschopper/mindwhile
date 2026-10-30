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

/** Text pairs, WCAG AA 4.5:1. */
const textPairs = [
  ['text', 'surface'],
  ['text', 'surface-raised'],
  ['accent', 'surface'],
  ['accent', 'surface-raised'],
  ['danger', 'surface'],
  ['danger', 'surface-raised'],
  ['success', 'surface'],
  ['success', 'surface-raised'],
  ['warning', 'surface'],
  ['warning', 'surface-raised'],
  ['on-warning', 'warning'],
  ['on-accent', 'accent'],
  ['on-success', 'success'],
  ['on-danger', 'danger'],
  ['link', 'surface'],
  ['link', 'surface-raised'],
  ['on-chrome', 'chrome-surface'],
  ['chrome-accent', 'chrome-surface'],
] as const

/** Icons and focus rings, WCAG AA 3:1. */
const graphicPairs = [
  ['focus-ring', 'surface'],
  ['focus-ring', 'surface-raised'],
  ['chrome-focus-ring', 'chrome-surface'],
] as const

it('defines every role token with light-dark()', () => {
  for (const role of roles) {
    expect(css).toMatch(new RegExp(`--${role}-color:\\s*light-dark\\(`))
  }
})

it('keeps hex values in the palette, roles use var()', () => {
  const roleBlock = css.slice(css.indexOf('/* Tier 2: roles */'))
  expect(roleBlock).not.toMatch(/#[0-9a-f]{3,8}\b/i)
})

const themes = [
  ['light', 0],
  ['dark', 1],
] as const

it.each([
  ['text', textPairs, 4.5],
  ['icons and focus rings', graphicPairs, 3],
] as const)('reaches the AA contrast for %s in light and dark', (_, pairs, minimum) => {
  for (const [theme, index] of themes) {
    for (const [fg, bg] of pairs) {
      const ratio = contrast(resolve(fg, index), resolve(bg, index))
      expect(ratio, `${fg}/${bg} (${theme}) = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(minimum)
    }
  }
})
