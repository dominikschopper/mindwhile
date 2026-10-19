import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

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
] as const

const palette = new Map<string, string>()
for (const m of css.matchAll(/^\s*(--[a-z0-9-]+):\s*(#[0-9a-f]{6});/gim)) {
  palette.set(m[1]!, m[2]!.toLowerCase())
}

const resolve = (role: string, theme: 0 | 1): string => {
  const m = new RegExp(
    `--${role}-color:\\s*light-dark\\(\\s*var\\((--[a-z0-9-]+)\\),\\s*var\\((--[a-z0-9-]+)\\)\\s*\\)`,
  ).exec(css)
  if (!m) throw new Error(`Role token missing or not light-dark(var(), var()): ${role}`)
  const hex = palette.get(m[theme + 1]!)
  if (!hex) throw new Error(`Unknown palette token: ${m[theme + 1]}`)
  return hex
}

const toLinear = (channel: number): number => {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const luminance = (hex: string): number => {
  const value = parseInt(hex.slice(1), 16)
  return (
    0.2126 * toLinear((value >> 16) & 255) +
    0.7152 * toLinear((value >> 8) & 255) +
    0.0722 * toLinear(value & 255)
  )
}

const contrast = (a: string, b: string): number => {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

const pairs = [
  ['text', 'surface'],
  ['text', 'surface-raised'],
  ['accent', 'surface'],
  ['danger', 'surface'],
  ['success', 'surface'],
  ['warning', 'surface'],
  ['warning', 'surface-raised'],
  ['on-warning', 'warning'],
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
