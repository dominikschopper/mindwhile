import type { GameTexts } from '@mindwhile/core'

// Texts are small (name, challenge names), so they load eagerly with the list.
const textModules = import.meta.glob<{ gameTexts: GameTexts }>(
  '../../../../../packages/games/*/src/texts.ts',
  { eager: true },
)

function idOf(path: string): string {
  const id = /\/games\/([^/]+)\/src\//.exec(path)?.[1]
  if (!id) throw new Error(`Cannot read game id from ${path}`)
  return id
}

export function collectGameTexts(
  modules: Record<string, { gameTexts: GameTexts }> = textModules,
): Record<string, GameTexts> {
  return Object.fromEntries(
    Object.entries(modules).map(([path, module]) => [idOf(path), module.gameTexts]),
  )
}

export const gameTexts: Record<string, GameTexts> = collectGameTexts()
