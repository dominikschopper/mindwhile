import { expect, it } from 'vitest'
import { manifest } from './manifest'

it('declares the three levels', () => {
  expect(manifest.id).toBe('spill-it')
  expect([...manifest.levels]).toEqual(['a', 'b', 'c'])
})

it('ranks more points as better, then a lower deviation', () => {
  expect(manifest.scoring.map(({ key, better }) => [key, better])).toEqual([
    ['points', 'higher'],
    ['deviation', 'lower'],
  ])
})

it('shows the grid-2x2 symbol on the tile', () => {
  expect(manifest.symbol).toBe('grid-2x2')
})

it('is at scoring version 0 until the first release', () => {
  expect(manifest.scoringVersion).toBe(0)
})
