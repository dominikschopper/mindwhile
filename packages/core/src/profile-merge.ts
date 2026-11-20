import type { ScorePosition } from './contract';
import { findBest, recordResult } from './best-results';
import type { Profile, ProfileData } from './profile-format';

/** Looks up the scoring of a stored result. Returns nothing for unknown games or levels. */
export type ScoringOf = (
  gameId: string,
  level: string,
  scoringVersion: number,
) => readonly ScorePosition[] | undefined;

function mergeProfile(local: Profile, incoming: Profile): Profile {
  const useLocal =
    local.playerId === incoming.playerId && local.gamerTagChangedAt > incoming.gamerTagChangedAt;
  const source = useLocal ? local : incoming;
  return {
    playerId: incoming.playerId,
    gamerTag: source.gamerTag,
    gamerSymbol: source.gamerSymbol,
    gamerTagChangedAt: source.gamerTagChangedAt,
  };
}

/**
 * Merges an incoming profile (from a file) into the local one. Pure: neither input is changed.
 * The player ID is always the incoming one. Tag, symbol and tag time come from the incoming
 * side, except when both sides share a player ID and the local tag is strictly newer. Best
 * results are kept per game, level and scoring version, the better one wins; a key that
 * `scoringOf` does not know keeps the local entry.
 */
export function mergeProfiles(
  local: ProfileData,
  incoming: ProfileData,
  scoringOf: ScoringOf,
): ProfileData {
  let best = local.best.map((entry) => ({ ...entry, scoreValues: [...entry.scoreValues] }));
  for (const entry of incoming.best) {
    const copy = { ...entry, scoreValues: [...entry.scoreValues] };
    const existing = findBest(best, entry.gameId, entry.level, entry.scoringVersion);
    if (existing === undefined) {
      best.push(copy);
      continue;
    }
    const scoring = scoringOf(entry.gameId, entry.level, entry.scoringVersion);
    if (scoring === undefined) {
      continue;
    }
    best = recordResult(best, copy, scoring);
  }
  return { profile: mergeProfile(local.profile, incoming.profile), best };
}
