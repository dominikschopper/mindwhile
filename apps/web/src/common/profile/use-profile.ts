import { readonly, shallowRef } from 'vue';
import type { Ref } from 'vue';
import { parseProfile, recordResult, serializeProfile } from '@mindwhile/core';
import type {
  GameManifest,
  Profile,
  ProfileData,
  RoundResult,
  StoredResult,
} from '@mindwhile/core';
import { showNotice } from '../composables/use-notice';
import { storage } from '../storage';
import type { KeyValueStorage } from '../storage';
import { t } from '../texts';
import { createDefaultProfile } from './default-profile';

/** The one key holding the whole profile envelope as JSON. */
export const PROFILE_KEY = 'mindwhile.profile';

function createAndStore(store: KeyValueStorage, now: number): ProfileData {
  const data: ProfileData = { profile: createDefaultProfile(undefined, now), best: [] };
  store.set(PROFILE_KEY, JSON.stringify(serializeProfile(data)));
  return data;
}

/**
 * Reads the profile from `store`. Nothing stored: creates and stores a default profile.
 * Unreadable or invalid value: replaces it with a new default profile and reports `discarded`.
 */
export function loadOrCreateProfile(
  store: KeyValueStorage,
  now: number = Date.now(),
): { data: ProfileData; discarded: boolean } {
  const raw = store.get(PROFILE_KEY);
  if (raw === null) return { data: createAndStore(store, now), discarded: false };
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return { data: createAndStore(store, now), discarded: true };
  }
  const parsed = parseProfile(input);
  if (!parsed.ok) return { data: createAndStore(store, now), discarded: true };
  // Skipped entries are dropped with the next write.
  return { data: parsed.data, discarded: false };
}

// Module level state, loaded lazily at the first `useProfile()` call.
let store: KeyValueStorage = storage;
let loaded = false;
const profile = shallowRef<Profile>({
  playerId: '',
  gamerTag: '',
  gamerSymbol: '',
  gamerTagChangedAt: 0,
});
const best = shallowRef<StoredResult[]>([]);

function ensureLoaded(): void {
  if (loaded) return;
  loaded = true;
  const { data, discarded } = loadOrCreateProfile(store);
  profile.value = data.profile;
  best.value = data.best;
  if (discarded) showNotice(t('notice.profileDiscarded'));
}

function recordRoundResult(
  manifest: GameManifest,
  level: string,
  seed: number,
  result: RoundResult,
): void {
  ensureLoaded();
  if (result.roundEnd === 'lost') return;
  const entry: StoredResult = {
    gameId: manifest.id,
    gameVersion: manifest.gameVersion,
    level,
    seed,
    scoreValues: [...result.score],
    scoringVersion: manifest.scoringVersion,
  };
  const next = recordResult(best.value, entry, manifest.scoring);
  if (!next.includes(entry)) return;
  best.value = next;
  store.set(PROFILE_KEY, JSON.stringify(serializeProfile({ profile: profile.value, best: next })));
}

export function useProfile() {
  ensureLoaded();
  return {
    profile: readonly(profile) as Readonly<Ref<Readonly<Profile>>>,
    best: readonly(best) as Readonly<Ref<readonly StoredResult[]>>,
    recordRoundResult,
  };
}

/** For tests only: forgets the module state so the next `useProfile()` loads again. */
export function resetProfileForTests(testStore: KeyValueStorage = storage): void {
  store = testStore;
  loaded = false;
}
