import { gameSymbols } from '@mindwhile/game-kit'
import { describe, expect, it } from 'vitest'
import { defaultGameRegistry } from './game-registry'

const games = defaultGameRegistry.listGames()

describe('game symbols', () => {
  it.each(games.map((game) => [game.id, game.manifest.symbol]))(
    'resolves the symbol of %s to an icon offered by game-kit',
    (_id, symbol) => {
      expect(Object.keys(gameSymbols)).toContain(symbol)
    },
  )

  it('resolves the spill-it symbol', () => {
    const spillIt = games.find((game) => game.id === 'spill-it')
    expect(spillIt?.manifest.symbol).toBe('grid-2x2')
    expect(gameSymbols['grid-2x2']).toBeDefined()
  })
})
