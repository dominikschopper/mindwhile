// Test-only: puts stored results into an in-memory profile storage.
import { serializeProfile } from '@mindwhile/core';
import type { StoredResult } from '@mindwhile/core';
import { createStorage } from '../storage';
import { PROFILE_KEY, resetProfileForTests } from './use-profile';

export function seedBestForTests(best: StoredResult[]): void {
  const storage = createStorage(null);
  storage.set(
    PROFILE_KEY,
    JSON.stringify(
      serializeProfile({
        profile: {
          playerId: 'AAAAAAAAAAA',
          gamerTag: 'Test Fox',
          gamerSymbol: 'star',
          gamerTagChangedAt: 0,
        },
        best,
      }),
    ),
  );
  resetProfileForTests(storage);
}

export function storedResult(
  gameId: string,
  level: string,
  scoreValues: number[],
  scoringVersion: number,
): StoredResult {
  return { gameId, gameVersion: 1, level, seed: 1, scoreValues, scoringVersion };
}
