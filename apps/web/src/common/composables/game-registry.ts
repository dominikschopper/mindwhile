import type { GameManifest, GameModule, GameTexts } from '@mindwhile/core'
import { inject } from 'vue'
import type { Component, InjectionKey } from 'vue'

export interface GameEntry {
  id: string
  manifest: GameManifest
  texts: GameTexts
  loadModule(): Promise<GameModule<Component>>
}

export interface GameRegistry {
  listGames(): GameEntry[]
  getGame(id: string): GameEntry | undefined
}

export interface GameGlobs {
  manifests: Record<string, { manifest: GameManifest }>
  texts: Record<string, { gameTexts: GameTexts }>
  modules: Record<string, () => Promise<{ gameModule: GameModule<Component> }>>
}

function folderOf(path: string): string {
  const folder = /\/games\/([^/]+)\/src\//.exec(path)?.[1]
  if (!folder) throw new Error(`Cannot read game folder from ${path}`)
  return folder
}

function byFolder<T>(entries: Record<string, T>): Map<string, T> {
  return new Map(Object.entries(entries).map(([path, value]) => [folderOf(path), value]))
}

export function createGameRegistry(globs: GameGlobs): GameRegistry {
  const manifests = byFolder(globs.manifests)
  const texts = byFolder(globs.texts)
  const modules = byFolder(globs.modules)
  const games = new Map<string, GameEntry>()

  for (const [folder, { manifest }] of manifests) {
    if (manifest.id !== folder) {
      throw new Error(`Game folder "${folder}" declares manifest id "${manifest.id}"`)
    }
    const gameTexts = texts.get(folder)
    const loader = modules.get(folder)
    if (!gameTexts) throw new Error(`Game "${folder}" has no texts.ts`)
    if (!loader) throw new Error(`Game "${folder}" has no module.ts`)
    games.set(folder, {
      id: folder,
      manifest,
      texts: gameTexts.gameTexts,
      async loadModule() {
        const { gameModule } = await loader()
        if (gameModule.manifest.id !== folder) {
          throw new Error(`Game module for ${folder} declares id ${gameModule.manifest.id}`)
        }
        return gameModule
      },
    })
  }
  for (const folder of [...texts.keys(), ...modules.keys()]) {
    if (!manifests.has(folder)) throw new Error(`Game "${folder}" has no manifest.ts`)
  }

  const sorted = [...games.values()].sort((a, b) => a.id.localeCompare(b.id))
  return {
    listGames: () => [...sorted],
    getGame: (id) => games.get(id),
  }
}

// Manifests and texts are small and load eagerly with the list, modules are lazy:
// one chunk per game, the view is only fetched when a game is opened.
export const defaultGameRegistry = createGameRegistry({
  manifests: import.meta.glob<{ manifest: GameManifest }>(
    '../../../../../packages/games/*/src/manifest.ts',
    { eager: true },
  ),
  texts: import.meta.glob<{ gameTexts: GameTexts }>(
    '../../../../../packages/games/*/src/texts.ts',
    { eager: true },
  ),
  modules: import.meta.glob<{ gameModule: GameModule<Component> }>(
    '../../../../../packages/games/*/src/module.ts',
  ),
})

export const gameRegistryKey: InjectionKey<GameRegistry> = Symbol('gameRegistry')

export function useGameRegistry(): GameRegistry {
  return inject(gameRegistryKey, defaultGameRegistry)
}
