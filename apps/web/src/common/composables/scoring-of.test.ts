import { describe, expect, it } from 'vitest';
import type { GameManifest } from '@mindwhile/core';
import type { GameEntry, GameRegistry } from './game-registry';
import { createScoringOf } from './scoring-of';

const scoring = [{ key: 'moves', better: 'lower' }] as const;
const manifest = { id: 'g', scoringVersion: 2, scoring } as unknown as GameManifest;
const registry: GameRegistry = {
  listGames: () => [],
  getGame: (id) => (id === 'g' ? ({ id, manifest } as GameEntry) : undefined),
};

describe('createScoringOf', () => {
  const scoringOf = createScoringOf(registry);
  it('returns the manifest scoring for the current version', () => {
    expect(scoringOf('g', 'a', 2)).toBe(scoring);
  });
  it('returns undefined for another scoring version', () => {
    expect(scoringOf('g', 'a', 1)).toBeUndefined();
  });
  it('returns undefined for an unknown game', () => {
    expect(scoringOf('x', 'a', 2)).toBeUndefined();
  });
});
