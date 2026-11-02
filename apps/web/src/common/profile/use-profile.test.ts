import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameManifest } from '@mindwhile/core';
import { dismissNotice, notice } from '../composables/use-notice';
import { createStorage } from '../storage';
import type { KeyValueStorage } from '../storage';
import { t } from '../texts';
import { PROFILE_KEY, loadOrCreateProfile, resetProfileForTests, useProfile } from './use-profile';

const manifest: GameManifest = {
  id: 'spill-it',
  color: 'blue',
  symbol: 'x',
  gameVersion: 1,
  scoringVersion: 1,
  interfaceVersion: 1,
  levels: ['a', 'b'],
  scoring: [{ key: 'moves', better: 'lower' }],
} as GameManifest;

function memoryBackend(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

function spied(initial: Record<string, string> = {}) {
  const store = createStorage(memoryBackend(initial));
  const set = vi.spyOn(store, 'set');
  return { store, set };
}

function stored(store: KeyValueStorage) {
  return JSON.parse(store.get(PROFILE_KEY) ?? 'null');
}

beforeEach(() => {
  dismissNotice();
});

describe('loading', () => {
  it('creates and stores a profile on empty storage', () => {
    const { store } = spied();
    resetProfileForTests(store);
    const first = useProfile();
    const env = stored(store);
    expect(env.app).toBe('mindwhile');
    expect(env.fmtv).toBe(1);
    expect(env.kind).toBe('profile');
    expect(env.profile.player).toHaveLength(11);
    expect(notice.value).toBeNull();
    expect(useProfile().profile.value).toEqual(first.profile.value);
  });

  it('uses a stored valid profile without rewriting', () => {
    const seed = createStorage(memoryBackend());
    const created = loadOrCreateProfile(seed).data;
    const { store, set } = spied({ [PROFILE_KEY]: seed.get(PROFILE_KEY) ?? '' });
    resetProfileForTests(store);
    const { profile, best } = useProfile();
    expect(profile.value).toEqual(created.profile);
    expect(best.value).toEqual([]);
    expect(set).not.toHaveBeenCalled();
    expect(notice.value).toBeNull();
  });

  const valid = () => {
    const s = createStorage(memoryBackend());
    loadOrCreateProfile(s);
    return stored(s);
  };
  const withTag = (env: { profile: object }, tag: string) => ({
    ...env,
    profile: { ...env.profile, tag },
  });
  const broken: [string, () => string][] = [
    ['not JSON', () => '{nope'],
    ['null', () => 'null'],
    ['an array', () => '[]'],
    ['wrong app', () => JSON.stringify({ ...valid(), app: 'other' })],
    ['fmtv 99', () => JSON.stringify({ ...valid(), fmtv: 99 })],
    ['emoji tag', () => JSON.stringify(withTag(valid(), 'Cool😀Fox'))],
  ];
  it.each(broken)('replaces a broken value (%s) and shows a notice', (_name, make) => {
    const bad = make();
    const { store } = spied({ [PROFILE_KEY]: bad });
    resetProfileForTests(store);
    useProfile();
    expect(store.get(PROFILE_KEY)).not.toBe(bad);
    expect(stored(store).kind).toBe('profile');
    expect(notice.value).toBe(t('notice.profileDiscarded'));
  });
});

describe('recordRoundResult', () => {
  it('stores the first won result', () => {
    const { store } = spied();
    resetProfileForTests(store);
    useProfile().recordRoundResult(manifest, 'a', 42, { roundEnd: 'won', score: [10] });
    expect(stored(store).best).toEqual([
      { game: 'spill-it', gamev: 1, lvl: 'a', seed: 42, score: [10], scorev: 1 },
    ]);
  });

  it('ignores a worse result and replaces with a better one', () => {
    const { store, set } = spied();
    resetProfileForTests(store);
    const p = useProfile();
    p.recordRoundResult(manifest, 'a', 1, { roundEnd: 'won', score: [10] });
    expect(set).toHaveBeenCalledTimes(2);
    p.recordRoundResult(manifest, 'a', 2, { roundEnd: 'won', score: [12] });
    expect(set).toHaveBeenCalledTimes(2);
    expect(p.best.value).toHaveLength(1);
    p.recordRoundResult(manifest, 'a', 3, { roundEnd: 'won', score: [8] });
    expect(set).toHaveBeenCalledTimes(3);
    expect(p.best.value).toHaveLength(1);
    expect(stored(store).best[0]).toMatchObject({ seed: 3, score: [8] });
  });

  it('does not store lost, stores ended', () => {
    const { store, set } = spied();
    resetProfileForTests(store);
    const p = useProfile();
    set.mockClear();
    p.recordRoundResult(manifest, 'a', 1, { roundEnd: 'lost', score: [1] });
    expect(set).not.toHaveBeenCalled();
    expect(p.best.value).toEqual([]);
    p.recordRoundResult(manifest, 'a', 1, { roundEnd: 'ended', score: [5] });
    expect(p.best.value).toHaveLength(1);
  });

  it('keeps another scoring version as a separate entry', () => {
    const { store } = spied();
    resetProfileForTests(store);
    const p = useProfile();
    p.recordRoundResult(manifest, 'a', 1, { roundEnd: 'won', score: [10] });
    p.recordRoundResult({ ...manifest, scoringVersion: 2 }, 'a', 1, {
      roundEnd: 'won',
      score: [20],
    });
    expect(p.best.value).toHaveLength(2);
  });

  it('keeps entries of unknown games', () => {
    const seed = createStorage(memoryBackend());
    loadOrCreateProfile(seed);
    const env = stored(seed);
    env.best = [{ game: 'other-game', gamev: 3, lvl: 'z', seed: 7, score: [1], scorev: 2 }];
    const { store } = spied({ [PROFILE_KEY]: JSON.stringify(env) });
    resetProfileForTests(store);
    useProfile().recordRoundResult(manifest, 'a', 1, { roundEnd: 'won', score: [10] });
    expect(stored(store).best).toHaveLength(2);
    expect(stored(store).best[0].game).toBe('other-game');
  });
});

describe('throwing backend', () => {
  it('works in memory without a notice', () => {
    const boom = () => {
      throw new Error('boom');
    };
    const store = createStorage({ getItem: boom, setItem: boom, removeItem: boom });
    resetProfileForTests(store);
    const p = useProfile();
    expect(p.profile.value.gamerTag).not.toBe('');
    p.recordRoundResult(manifest, 'a', 1, { roundEnd: 'won', score: [10] });
    expect(p.best.value).toHaveLength(1);
    expect(notice.value).toBeNull();
  });
});
