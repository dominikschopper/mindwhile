import { expect, it } from 'vitest'
import { manifest } from './manifest'

it('declares the three challenges', () => {
  expect(manifest.id).toBe('spill-it')
  expect([...manifest.challenges]).toEqual(['a', 'b', 'c'])
})

it('ranks a lower deviation as better', () => {
  expect(manifest.scoring[0].better).toBe('lower')
})

it('is at scoring version 0 until the first release', () => {
  expect(manifest.scoringVersion).toBe(0)
})
