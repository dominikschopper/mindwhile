import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { buildUtilities, readSpacingSizes } from '../../scripts/generate-utilities.ts'

const read = (name: string) => readFileSync(new URL(name, import.meta.url), 'utf8')

it('declares the layer order exactly, before any import', () => {
  const index = read('./index.css')
  const order = '@layer reset, tokens, layout, components, utilities;'
  expect(index).toContain(order)
  expect(index.indexOf(order)).toBeLessThan(index.indexOf('@import'))
})

it('has margin, padding and gap utilities for every spacing token', () => {
  const sizes = readSpacingSizes(read('./tokens.css'))
  expect(sizes).toEqual(['xs', 'sm', 'md', 'lg', 'xl'])
  const css = read('./utilities.css')
  for (const size of sizes) {
    for (const prefix of [
      'm',
      'mt',
      'mr',
      'mb',
      'ml',
      'mx',
      'my',
      'p',
      'pt',
      'pr',
      'pb',
      'pl',
      'px',
      'py',
      'gap',
    ]) {
      expect(css).toContain(`.${prefix}-${size} {`)
    }
  }
  expect(css).toContain('.text-center')
  expect(css).toContain('.visually-hidden')
})

it('keeps utilities.css in sync with the generator', () => {
  expect(read('./utilities.css')).toBe(buildUtilities(readSpacingSizes(read('./tokens.css'))))
})

it('defines every role token with light-dark()', () => {
  const css = read('./tokens.css')
  for (const role of [
    'text',
    'surface',
    'surface-raised',
    'border',
    'accent',
    'warning',
    'focus-ring',
  ]) {
    expect(css).toMatch(new RegExp(`--${role}-color:\\s*light-dark\\(`))
  }
})

it('credits the reset source and does not use #root', () => {
  const css = read('./reset.css')
  expect(css).toContain('https://www.joshwcomeau.com/css/custom-css-reset/')
  expect(css).not.toContain('#root')
})

it('defines the page width rule in the layout layer and imports it', () => {
  const css = read('./layout.css')
  expect(css).toMatch(
    /@layer layout\s*\{[\s\S]*\.content-column\s*\{[^}]*width:\s*min\(98%, 960px\)/,
  )
  expect(css).toContain('margin-inline: auto')
  expect(read('./index.css')).toContain("@import './layout.css';")
})
