// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { loadGameModule } from './load-game-module'

it('loads the spill-it module', async () => {
  const module = await loadGameModule('spill-it')
  expect(module.manifest.id).toBe('spill-it')
  expect(module.View).toBeTruthy()
})

it('rejects an unknown id', async () => {
  await expect(loadGameModule('nope')).rejects.toThrow('Unknown game: nope')
})

it('rejects a module whose manifest id differs', async () => {
  const loaders = {
    '/games/x/src/module.ts': async () => ({
      gameModule: { manifest: { id: 'y' } } as never,
    }),
  }
  await expect(loadGameModule('x', loaders)).rejects.toThrow('declares id y')
})
