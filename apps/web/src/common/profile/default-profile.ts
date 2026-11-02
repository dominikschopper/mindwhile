import { createRng, newPlayerId, newSeed, nextBelow } from '@mindwhile/core';
import type { Profile } from '@mindwhile/core';
import { profileSymbolNames } from '@mindwhile/game-kit';
import { createDefaultTag } from './default-tag';

// Draw order is fixed: adjective, animal, symbol. The player ID does not come from the seed.
export function createDefaultProfile(seed: number = newSeed(), now: number = Date.now()): Profile {
  const rng = createRng(seed);
  const gamerTag = createDefaultTag(rng);
  const gamerSymbol = profileSymbolNames[nextBelow(rng, profileSymbolNames.length)];
  if (gamerSymbol === undefined) throw new Error('no profile symbols');
  return { playerId: newPlayerId(), gamerTag, gamerSymbol, gamerTagChangedAt: now };
}
