import { describe, expect, it } from 'vitest';
import type { ScorePosition } from './contract';
import type { ProfileData, StoredResult } from './profile-format';
import { mergeProfiles } from './profile-merge';
import type { ScoringOf } from './profile-merge';

const scorings: Record<string, readonly ScorePosition[]> = {
  'spill-it': [{ key: 'points', better: 'higher' }],
  'low-game': [{ key: 'moves', better: 'lower' }],
  'jelly-sort': [
    { key: 'points', better: 'higher' },
    { key: 'deviation', better: 'lower' },
  ],
};
const scoringOf: ScoringOf = (gameId) => scorings[gameId];

function result(overrides: Partial<StoredResult> = {}): StoredResult {
  return {
    gameId: 'spill-it',
    gameVersion: 1,
    level: 'a',
    seed: 1,
    scoreValues: [100],
    scoringVersion: 1,
    ...overrides,
  };
}

function data(
  playerId: string,
  tag: string,
  symbol: string,
  tagat: number,
  best: StoredResult[] = [],
): ProfileData {
  return {
    profile: { playerId, gamerTag: tag, gamerSymbol: symbol, gamerTagChangedAt: tagat },
    best,
  };
}

describe('mergeProfiles profile part', () => {
  it('takes tag, symbol and tagat from the file for different player IDs', () => {
    const merged = mergeProfiles(data('L', 'loc', 'x', 900), data('I', 'inc', 'y', 100), scoringOf);
    expect(merged.profile).toEqual({
      playerId: 'I',
      gamerTag: 'inc',
      gamerSymbol: 'y',
      gamerTagChangedAt: 100,
    });
  });

  it('keeps local tag and symbol for the same ID when local is newer', () => {
    const merged = mergeProfiles(data('P', 'loc', 'x', 900), data('P', 'inc', 'y', 100), scoringOf);
    expect(merged.profile).toEqual({
      playerId: 'P',
      gamerTag: 'loc',
      gamerSymbol: 'x',
      gamerTagChangedAt: 900,
    });
  });

  it('takes the file when it is newer for the same ID', () => {
    const merged = mergeProfiles(data('P', 'loc', 'x', 100), data('P', 'inc', 'y', 900), scoringOf);
    expect(merged.profile.gamerTag).toBe('inc');
    expect(merged.profile.gamerSymbol).toBe('y');
    expect(merged.profile.gamerTagChangedAt).toBe(900);
  });

  it('lets the file win on an exact tie', () => {
    const merged = mergeProfiles(data('P', 'loc', 'x', 500), data('P', 'inc', 'y', 500), scoringOf);
    expect(merged.profile.gamerTag).toBe('inc');
    expect(merged.profile.gamerSymbol).toBe('y');
  });
});

describe('mergeProfiles best part', () => {
  const p = (best: StoredResult[]) => data('P', 't', 's', 1, best);

  it('lets the better score win in both directions (higher)', () => {
    const low = result({ scoreValues: [100] });
    const high = result({ scoreValues: [300], seed: 9 });
    expect(mergeProfiles(p([low]), p([high]), scoringOf).best).toEqual([high]);
    expect(mergeProfiles(p([high]), p([low]), scoringOf).best).toEqual([high]);
  });

  it('lets the better score win in both directions (lower)', () => {
    const few = result({ gameId: 'low-game', scoreValues: [10] });
    const many = result({ gameId: 'low-game', scoreValues: [30], seed: 9 });
    expect(mergeProfiles(p([many]), p([few]), scoringOf).best).toEqual([few]);
    expect(mergeProfiles(p([few]), p([many]), scoringOf).best).toEqual([few]);
  });

  it('keeps keys that exist on one side only', () => {
    const onlyLocal = result({ level: 'a' });
    const onlyIncoming = result({ level: 'b' });
    const versioned = result({ scoringVersion: 2 });
    const merged = mergeProfiles(p([onlyLocal]), p([onlyIncoming, versioned]), scoringOf);
    expect(merged.best).toHaveLength(3);
    expect(merged.best).toEqual(expect.arrayContaining([onlyLocal, onlyIncoming, versioned]));
  });

  it('merges the best results of two games independently, each with its own scoring', () => {
    const local = [
      result({ gameId: 'spill-it', scoreValues: [100] }),
      result({ gameId: 'jelly-sort', scoreValues: [300, 2], scoringVersion: 0 }),
    ];
    const incoming = [
      result({ gameId: 'spill-it', scoreValues: [400], seed: 9 }),
      result({ gameId: 'jelly-sort', scoreValues: [250, 0], scoringVersion: 0, seed: 9 }),
      result({ gameId: 'jelly-sort', level: 'b', scoreValues: [120, 1], scoringVersion: 0 }),
    ];
    const merged = mergeProfiles(p(local), p(incoming), scoringOf);
    // Spill It: higher points win, the incoming 400 replaces the local 100.
    expect(
      merged.best.find((e) => e.gameId === 'spill-it' && e.level === 'a')?.scoreValues,
    ).toEqual([400]);
    // Jelly Sort: points come first, so the local 300 beats the incoming 250 despite its deviation.
    expect(
      merged.best.find((e) => e.gameId === 'jelly-sort' && e.level === 'a')?.scoreValues,
    ).toEqual([300, 2]);
    expect(
      merged.best.find((e) => e.gameId === 'jelly-sort' && e.level === 'b')?.scoreValues,
    ).toEqual([120, 1]);
    expect(merged.best).toHaveLength(3);
  });

  it('decides a tie on points by the deviation of the same game only', () => {
    const local = [result({ gameId: 'jelly-sort', scoreValues: [300, 4], scoringVersion: 0 })];
    const incoming = [
      result({ gameId: 'jelly-sort', scoreValues: [300, 1], scoringVersion: 0, seed: 9 }),
      result({ gameId: 'spill-it', scoreValues: [50] }),
    ];
    const merged = mergeProfiles(p(local), p(incoming), scoringOf);
    expect(merged.best).toEqual([
      expect.objectContaining({ gameId: 'jelly-sort', scoreValues: [300, 1] }),
      expect.objectContaining({ gameId: 'spill-it', scoreValues: [50] }),
    ]);
  });

  it('keeps the local entry for an unknown game and keeps incoming-only unknown entries', () => {
    const local = result({ gameId: 'ghost', scoreValues: [1] });
    const incoming = result({ gameId: 'ghost', scoreValues: [999] });
    const other = result({ gameId: 'phantom' });
    const merged = mergeProfiles(p([local]), p([incoming, other]), scoringOf);
    expect(merged.best).toEqual([local, other]);
  });

  it('handles empty best on either side', () => {
    const a = result();
    expect(mergeProfiles(p([]), p([a]), scoringOf).best).toEqual([a]);
    expect(mergeProfiles(p([a]), p([]), scoringOf).best).toEqual([a]);
    expect(mergeProfiles(p([]), p([]), scoringOf).best).toEqual([]);
  });

  it('does not mutate the inputs', () => {
    const local = p([result({ scoreValues: [100] }), result({ level: 'c' })]);
    const incoming = data('Q', 'i', 'j', 5, [
      result({ scoreValues: [500] }),
      result({ level: 'b' }),
    ]);
    const localCopy = JSON.parse(JSON.stringify(local));
    const incomingCopy = JSON.parse(JSON.stringify(incoming));
    const merged = mergeProfiles(local, incoming, scoringOf);
    expect(local).toEqual(localCopy);
    expect(incoming).toEqual(incomingCopy);
    expect(merged.best[0]).not.toBe(incoming.best[0]);
    expect(merged.best[0]?.scoreValues).not.toBe(incoming.best[0]?.scoreValues);
  });

  it('has no duplicate keys', () => {
    const a = result();
    const b = result({ level: 'b' });
    const merged = mergeProfiles(
      p([a, b]),
      p([result({ scoreValues: [400] }), b, result({ level: 'c' })]),
      scoringOf,
    );
    const keys = merged.best.map((e) => `${e.gameId}/${e.level}/${e.scoringVersion}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toHaveLength(3);
  });
});
