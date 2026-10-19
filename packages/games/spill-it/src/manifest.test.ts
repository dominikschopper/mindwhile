import { expect, it } from 'vitest'
import { manifest } from './manifest'

it('declares the three challenges', () => {
  expect(manifest.id).toBe('spill-it')
  expect([...manifest.challenges]).toEqual(['a', 'b', 'c'])
})

it('ranks more points as better, then a lower deviation', () => {
  expect(manifest.scoring.map(({ key, better }) => [key, better])).toEqual([
    ['points', 'higher'],
    ['deviation', 'lower'],
  ])
})

it('is at scoring version 0 until the first release', () => {
  expect(manifest.scoringVersion).toBe(0)
})
