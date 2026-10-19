import type { GameModule } from '@mindwhile/core'
import type { Component } from 'vue'

export type LoadedGameModule = GameModule<Component> & {
  // Not part of the GameModule type yet, a game may export it next to gameModule.
  formatScore?: (score: readonly number[]) => string
}

type ModuleExports = { gameModule: GameModule<Component> } & Pick<LoadedGameModule, 'formatScore'>

// Lazy: one chunk per game, the view is only fetched when a game is opened.
const moduleLoaders = import.meta.glob<ModuleExports>(
  '../../../../../packages/games/*/src/module.ts',
)

export async function loadGameModule(
  id: string,
  loaders: Record<string, () => Promise<ModuleExports>> = moduleLoaders,
): Promise<LoadedGameModule> {
  const entry = Object.entries(loaders).find(([path]) => path.includes(`/games/${id}/src/`))
  if (!entry) throw new Error(`Unknown game: ${id}`)
  const { gameModule, formatScore } = await entry[1]()
  if (gameModule.manifest.id !== id) {
    throw new Error(`Game module for ${id} declares id ${gameModule.manifest.id}`)
  }
  return formatScore ? { ...gameModule, formatScore } : gameModule
}
