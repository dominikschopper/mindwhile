import { describe, expect, it } from 'vitest';
import {
  profileFromWire,
  profileToWire,
  serializeProfile,
  storedResultFromWire,
  storedResultToWire,
} from './profile-format';
import type { ProfileData, StoredResult } from './profile-format';
import { parseProfile, parseProfileWith } from './profile-parse';

function makeResult(): StoredResult {
  return {
    gameId: 'spill-it',
    gameVersion: 2,
    level: 'b',
    seed: 12345,
    scoreValues: [7, 42],
    scoringVersion: 3,
  };
}

function makeData(): ProfileData {
  return {
    profile: {
      playerId: 'abc',
      gamerTag: 'Tina',
      gamerSymbol: 'star',
      gamerTagChangedAt: 1760558400000,
    },
    best: [makeResult()],
  };
}

describe('serializeProfile', () => {
  const env = serializeProfile(makeData());

  it('carries the envelope fields', () => {
    expect(env.app).toBe('mindwhile');
    expect(env.fmtv).toBe(1);
    expect(env.kind).toBe('profile');
  });

  it('maps every profile key', () => {
    expect(env.profile.player).toBe('abc');
    expect(env.profile.tag).toBe('Tina');
    expect(env.profile.symbol).toBe('star');
    expect(env.profile.tagat).toBe(1760558400000);
  });

  it('maps every result key', () => {
    const r = env.best[0]!;
    expect(r.game).toBe('spill-it');
    expect(r.gamev).toBe(2);
    expect(r.lvl).toBe('b');
    expect(r.seed).toBe(12345);
    expect(r.score).toEqual([7, 42]);
    expect(r.scorev).toBe(3);
  });

  it('has no player key in results', () => {
    expect(env.best[0]).not.toHaveProperty('player');
  });

  it('has no key outside the format', () => {
    const allowed = new Set([
      'app',
      'fmtv',
      'kind',
      'profile',
      'best',
      'player',
      'tag',
      'symbol',
      'tagat',
      'game',
      'gamev',
      'lvl',
      'seed',
      'score',
      'scorev',
    ]);
    const keys: string[] = [];
    JSON.stringify(env, (key, value) => {
      if (key !== '' && !/^\d+$/.test(key)) keys.push(key);
      return value;
    });
    expect(keys.filter((k) => !allowed.has(k))).toEqual([]);
  });

  it('does not change or share the input', () => {
    const data = makeData();
    const copy = JSON.parse(JSON.stringify(data)) as ProfileData;
    const out = serializeProfile(data);
    expect(data).toEqual(copy);
    expect(out.best[0]!.score).not.toBe(data.best[0]!.scoreValues);
    out.best[0]!.score.push(1);
    expect(data).toEqual(copy);
  });
});

describe('wire mapping round trip', () => {
  it('profile', () => {
    const p = makeData().profile;
    expect(profileFromWire(profileToWire(p))).toEqual(p);
  });

  it('stored result', () => {
    const r = makeResult();
    expect(storedResultFromWire(storedResultToWire(r))).toEqual(r);
  });
});

describe('parseProfile', () => {
  const validId = 'AAAAAAAAAAA';

  function validData(): ProfileData {
    const data = makeData();
    data.profile.playerId = validId;
    return data;
  }

  function envelope(): Record<string, unknown> {
    return JSON.parse(JSON.stringify(serializeProfile(validData()))) as Record<string, unknown>;
  }

  function withProfile(patch: Record<string, unknown>): Record<string, unknown> {
    const env = envelope();
    env.profile = { ...(env.profile as object), ...patch };
    return env;
  }

  function entry(n: number): Record<string, unknown> {
    return { game: 'g' + n, gamev: 1, lvl: 'a', seed: 1, score: [1], scorev: 1 };
  }

  function withBest(best: unknown): Record<string, unknown> {
    return { ...envelope(), best };
  }

  function reason(input: unknown): string | undefined {
    const r = parseProfile(input);
    return r.ok ? undefined : r.reason;
  }

  it('round trip', () => {
    const data = validData();
    expect(parseProfile(serializeProfile(data))).toEqual({ ok: true, data, skipped: 0 });
    const viaJson = JSON.parse(JSON.stringify(serializeProfile(data))) as unknown;
    expect(parseProfile(viaJson)).toEqual({ ok: true, data, skipped: 0 });
  });

  it('not-an-object', () => {
    expect(reason(null)).toBe('not-an-object');
    expect(reason([])).toBe('not-an-object');
    expect(reason(5)).toBe('not-an-object');
  });

  it('foreign-app and unknown-kind', () => {
    expect(reason({ ...envelope(), app: 'other' })).toBe('foreign-app');
    expect(reason({ ...envelope(), kind: 'board' })).toBe('unknown-kind');
  });

  it('invalid-version and newer-version', () => {
    expect(reason({ ...envelope(), fmtv: 0 })).toBe('invalid-version');
    expect(reason({ ...envelope(), fmtv: 1.5 })).toBe('invalid-version');
    expect(reason({ ...envelope(), fmtv: '1' })).toBe('invalid-version');
    expect(reason({ ...envelope(), fmtv: 2 })).toBe('newer-version');
  });

  it('invalid-profile', () => {
    expect(reason(withProfile({ player: 'nope' }))).toBe('invalid-profile');
    expect(reason(withProfile({ tag: 'a'.repeat(17) }))).toBe('invalid-profile');
    expect(reason(withProfile({ tag: 'Tina😀' }))).toBe('invalid-profile');
    expect(reason(withProfile({ tag: 'Jürgen' }))).toBe('invalid-profile');
    expect(reason(withProfile({ tag: '' }))).toBe('invalid-profile');
    expect(reason(withProfile({ symbol: '' }))).toBe('invalid-profile');
    expect(reason(withProfile({ tagat: -1 }))).toBe('invalid-profile');
    const noProfile = envelope();
    delete noProfile.profile;
    expect(reason(noProfile)).toBe('invalid-profile');
    const noTag = envelope();
    const p = { ...(noTag.profile as Record<string, unknown>) };
    delete p.tag;
    noTag.profile = p;
    expect(reason(noTag)).toBe('invalid-profile');
    const noBest = envelope();
    delete noBest.best;
    expect(reason(noBest)).toBe('invalid-profile');
    expect(reason(withBest('x'))).toBe('invalid-profile');
    expect(reason(withBest({}))).toBe('invalid-profile');
  });

  it('accepts a tag of 16 characters with space and hyphen', () => {
    expect(parseProfile(withProfile({ tag: 'Ab 1-Ab 1-Ab 1-Ab1'.slice(0, 16) })).ok).toBe(true);
  });

  it('limits the number of results', () => {
    const many = Array.from({ length: 2001 }, (_, i) => entry(i));
    expect(reason(withBest(many))).toBe('too-many-results');
    const ok = parseProfile(withBest(many.slice(0, 2000)));
    expect(ok.ok && ok.data.best.length).toBe(2000);
  });

  it('skips invalid entries and counts them', () => {
    const best = [
      entry(1),
      'text',
      null,
      { ...entry(2), gamev: '1' },
      { ...entry(3), game: 'x'.repeat(65) },
      { ...entry(4), score: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
      { ...entry(5), score: [] },
      { ...entry(6), score: [1.5] },
      { ...entry(7), seed: -1 },
      { ...entry(8), seed: 4294967296 },
      { ...entry(1) },
      { ...entry(9), game: 'future-game' },
      { ...entry(10), seed: 4294967295, score: [1, 2, 3, 4, 5, 6, 7, 8] },
    ];
    const r = parseProfile(withBest(best));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.skipped).toBe(10);
    expect(r.data.best.map((b) => b.gameId)).toEqual(['g1', 'future-game', 'g10']);
  });

  it('keeps the first of duplicates by game, lvl and scorev', () => {
    const r = parseProfile(
      withBest([entry(1), { ...entry(1), seed: 99 }, { ...entry(1), scorev: 2 }]),
    );
    expect(r.ok && r.data.best.map((b) => b.seed)).toEqual([1, 1]);
    expect(r.ok && r.skipped).toBe(1);
  });

  it('accepts an unknown symbol name', () => {
    const r = parseProfile(withProfile({ symbol: 'future-shape' }));
    expect(r.ok && r.data.profile.gamerSymbol).toBe('future-shape');
  });

  it('ignores unknown extra fields', () => {
    const env = envelope();
    env.extra = 1;
    env.profile = { ...(env.profile as object), more: 2 };
    env.best = [{ ...entry(1), junk: 3 }];
    const r = parseProfile(env);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(Object.keys(r.data)).toEqual(['profile', 'best']);
    expect(Object.keys(r.data.profile).sort()).toEqual([
      'gamerSymbol',
      'gamerTag',
      'gamerTagChangedAt',
      'playerId',
    ]);
    expect(Object.keys(r.data.best[0]!).sort()).toEqual([
      'gameId',
      'gameVersion',
      'level',
      'scoreValues',
      'scoringVersion',
      'seed',
    ]);
  });

  it('runs older versions through the migration steps', () => {
    const steps = [
      (d: unknown) => {
        const o = d as Record<string, unknown>;
        return { ...o, profile: { ...(o.profile as object), tag: 'Migrated' } };
      },
    ];
    const r = parseProfileWith(envelope(), steps);
    expect(r.ok && r.data.profile.gamerTag).toBe('Migrated');
    expect(parseProfileWith({ ...envelope(), fmtv: 2 }, steps).ok).toBe(true);
    expect(parseProfileWith({ ...envelope(), fmtv: 3 }, steps)).toEqual({
      ok: false,
      reason: 'newer-version',
    });
  });
});
