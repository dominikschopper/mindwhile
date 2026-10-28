import { readFileSync } from 'node:fs'

export const readStyle = (name: string): string =>
  readFileSync(new URL(name, import.meta.url), 'utf8')

/** Palette tokens (`--name: #rrggbb;`) of a stylesheet. */
export const readPalette = (css: string): Map<string, string> => {
  const palette = new Map<string, string>()
  for (const m of css.matchAll(/^\s*(--[a-z0-9-]+):\s*(#[0-9a-f]{6});/gim)) {
    palette.set(m[1]!, m[2]!.toLowerCase())
  }
  return palette
}

/** Resolves `--<name>: light-dark(var(--a), var(--b))` in `source` to a hex value. */
export const resolveLightDark = (
  source: string,
  palette: Map<string, string>,
  name: string,
  theme: 0 | 1,
): string => {
  const m = new RegExp(
    `${name}:\\s*light-dark\\(\\s*var\\((--[a-z0-9-]+)\\),\\s*var\\((--[a-z0-9-]+)\\)\\s*\\)`,
  ).exec(source)
  if (!m) throw new Error(`Token missing or not light-dark(var(), var()): ${name}`)
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

export const contrast = (a: string, b: string): number => {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
