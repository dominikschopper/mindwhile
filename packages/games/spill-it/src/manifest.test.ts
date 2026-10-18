import { expect, it } from 'vitest'
import { manifest } from './manifest'

it('declares the three challenges', () => {
  expect(manifest.id).toBe('spill-it')
  expect([...manifest.challenges]).toEqual(['a', 'b', 'c'])
})

it('ranks a lower deviation as better', () => {
  expect(manifest.scoring[0].better).toBe('lower')
})
