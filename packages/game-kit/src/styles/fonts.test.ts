import { existsSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const css = readFileSync(new URL('./fonts.css', import.meta.url), 'utf8')

it('references no remote URLs', () => {
  expect(css).not.toMatch(/https?:\/\//)
})

it('references font files that exist', () => {
  const urls = [...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => m[1] as string)
  expect(urls.length).toBeGreaterThan(0)
  for (const url of urls) {
    expect(existsSync(new URL(url, import.meta.url))).toBe(true)
  }
})
