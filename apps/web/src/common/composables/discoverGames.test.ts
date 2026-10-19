import { expect, it } from 'vitest'
import { discoverGames } from './discoverGames'

it('finds the spill-it manifest', () => {
  expect(discoverGames().map((game) => game.id)).toContain('spill-it')
})
