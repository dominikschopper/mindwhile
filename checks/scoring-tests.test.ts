import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Every challenge in a game manifest needs a scoring test file next to the logic:
// packages/games/<game>/src/scoring.<challenge>.test.ts
// Games listed here have no scoring tests yet. Remove the entry when the game
// gets its tests (the Spillit plan adds them), the check is mandatory afterwards.
const pendingGames: string[] = []

const gamesDir = join(import.meta.dirname, '..', 'packages', 'games')
const gameFolders = readdirSync(gamesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

describe.each(gameFolders)('scoring tests of %s', (folder) => {
  it('has a test file for every challenge in the manifest', async () => {
    const { manifest } = (await import(join(gamesDir, folder, 'src', 'manifest.ts'))) as {
      manifest: { id: string; challenges: readonly string[] }
    }
    if (pendingGames.includes(manifest.id)) {
      return
    }
    const missing = manifest.challenges.filter(
      (challenge) => !existsSync(join(gamesDir, folder, 'src', `scoring.${challenge}.test.ts`)),
    )
    expect(missing, `missing scoring tests for challenges: ${missing.join(', ')}`).toEqual([])
  })
})
