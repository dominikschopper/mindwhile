import { expect, it } from 'vitest'
import { gameKitCore, gameKitName } from './index'

it('resolves core through the workspace', () => {
  expect(gameKitName).toBe('game-kit')
  expect(gameKitCore).toBe('core')
})
