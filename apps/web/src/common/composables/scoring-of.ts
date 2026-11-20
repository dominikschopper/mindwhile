import type { ScoringOf } from '@mindwhile/core';
import { useGameRegistry } from './game-registry';
import type { GameRegistry } from './game-registry';

/**
 * Builds a `ScoringOf` from the game registry. An unknown game or a scoring version other
 * than the manifest's current one gives `undefined`.
 */
export function createScoringOf(registry: GameRegistry): ScoringOf {
  return (gameId, _level, scoringVersion) => {
    const manifest = registry.getGame(gameId)?.manifest;
    if (!manifest || manifest.scoringVersion !== scoringVersion) return undefined;
    return manifest.scoring;
  };
}

/** `ScoringOf` for the injected registry. Call inside setup. */
export function useScoringOf(): ScoringOf {
  return createScoringOf(useGameRegistry());
}
