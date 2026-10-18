// Games are found by their manifest files, a new game is just a new folder.
// Manifests are pure data, so loading them eagerly pulls in no view.
const manifestModules = import.meta.glob<{ manifest: GameManifestLike }>(
  '../../../../packages/games/*/src/manifest.ts',
  { eager: true },
)

export interface GameManifestLike {
  readonly id: string
}

export function discoverGames(
  modules: Record<string, { manifest: GameManifestLike }> = manifestModules,
): GameManifestLike[] {
  return Object.values(modules)
    .map((module) => module.manifest)
    .sort((a, b) => a.id.localeCompare(b.id))
}
