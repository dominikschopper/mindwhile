import { computed } from 'vue';
import { useProfile } from '../profile/use-profile';
import { useGameRegistry } from './game-registry';

/**
 * Best score lists from the profile. Only entries of the current scoring version of a
 * known game are returned, others stay stored but are not shown. Call inside setup.
 */
export function useBestResults() {
  const { best } = useProfile();
  const registry = useGameRegistry();
  const index = computed(() => {
    const map = new Map<string, readonly number[]>();
    for (const entry of best.value) {
      const manifest = registry.getGame(entry.gameId)?.manifest;
      if (!manifest || manifest.scoringVersion !== entry.scoringVersion) continue;
      map.set(`${entry.gameId}\u0000${entry.level}`, entry.scoreValues);
    }
    return map;
  });

  function bestScore(gameId: string, level: string): readonly number[] | undefined {
    return index.value.get(`${gameId}\u0000${level}`);
  }

  return { bestScore };
}
