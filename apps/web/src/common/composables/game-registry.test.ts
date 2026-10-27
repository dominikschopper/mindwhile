// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import type { GameManifest, GameModule, GameTexts } from '@mindwhile/core'
import type { Component } from 'vue'
import {
  createGameRegistry,
  defaultGameRegistry,
  gameRegistryKey,
  useGameRegistry,
} from './game-registry'
import type { GameGlobs } from './game-registry'

const fakeManifest = (id: string) =>
  ({ id, symbol: 'grid-2x2', levels: ['a'] }) as unknown as GameManifest
const fakeTexts = { name: 'X', levelName: (c: string) => c, formatScore: () => '' } as GameTexts

function fakeGlobs(folder: string, manifestId = folder): GameGlobs {
  const path = (file: string) => `/p/packages/games/${folder}/src/${file}.ts`
  return {
    manifests: { [path('manifest')]: { manifest: fakeManifest(manifestId) } },
    texts: { [path('texts')]: { gameTexts: fakeTexts } },
    modules: {
      [path('module')]: async () => ({
        gameModule: { manifest: fakeManifest(manifestId) } as GameModule<Component>,
      }),
    },
  }
}

describe('default registry', () => {
  it('has manifest, texts and loader for spill-it', async () => {
    const registry = defaultGameRegistry
    expect(registry.listGames().map((game) => game.id)).toContain('spill-it')
    const game = registry.getGame('spill-it')
    expect(game?.manifest.id).toBe('spill-it')
    expect(game?.texts.name).toBe('Spillit')
    const module = await game!.loadModule()
    expect(module.manifest.id).toBe('spill-it')
    expect(module.View).toBeTruthy()
  })

  it('returns undefined for an unknown id', () => {
    expect(defaultGameRegistry.getGame('nope')).toBeUndefined()
  })
})

describe('createGameRegistry', () => {
  it('sorts games by id', () => {
    const a = fakeGlobs('b-game')
    const b = fakeGlobs('a-game')
    const registry = createGameRegistry({
      manifests: { ...a.manifests, ...b.manifests },
      texts: { ...a.texts, ...b.texts },
      modules: { ...a.modules, ...b.modules },
    })
    expect(registry.listGames().map((game) => game.id)).toEqual(['a-game', 'b-game'])
  })

  it('throws when the folder differs from the manifest id', () => {
    expect(() => createGameRegistry(fakeGlobs('x', 'y'))).toThrow(/"x".*"y"/)
  })

  it('throws when a game lacks texts', () => {
    expect(() => createGameRegistry({ ...fakeGlobs('x'), texts: {} })).toThrow('no texts.ts')
  })

  it('throws when a game lacks a module', () => {
    expect(() => createGameRegistry({ ...fakeGlobs('x'), modules: {} })).toThrow('no module.ts')
  })

  it('throws when a game lacks a manifest', () => {
    expect(() => createGameRegistry({ ...fakeGlobs('x'), manifests: {} })).toThrow('no manifest.ts')
  })
})

describe('useGameRegistry', () => {
  it('uses the provided registry inside a component', () => {
    const fake = createGameRegistry(fakeGlobs('fake-game'))
    let ids: string[] = []
    const Probe = defineComponent({
      setup() {
        ids = useGameRegistry()
          .listGames()
          .map((game) => game.id)
        return () => h('div')
      },
    })
    mount(Probe, { global: { provide: { [gameRegistryKey as symbol]: fake } } })
    expect(ids).toEqual(['fake-game'])
  })
})
