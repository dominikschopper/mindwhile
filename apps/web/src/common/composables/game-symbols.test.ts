import { gameSymbols } from '@mindwhile/game-kit'
import { describe, expect, it } from 'vitest'
import { discoverGames } from './discoverGames'

describe('game symbols', () => {
  it.each(discoverGames().map((game) => [game.id, game.symbol]))(
    'resolves the symbol of %s to an icon offered by game-kit',
    (_id, symbol) => {
      expect(Object.keys(gameSymbols)).toContain(symbol)
    },
  )

  it('resolves the spill-it symbol', () => {
    const spillIt = discoverGames().find((game) => game.id === 'spill-it')
    expect(spillIt?.symbol).toBe('grid-2x2')
    expect(gameSymbols['grid-2x2']).toBeDefined()
  })
})
