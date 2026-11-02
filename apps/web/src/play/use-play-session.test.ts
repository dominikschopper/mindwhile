// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { gameRegistryKey } from '../common/composables/game-registry';
import { roundState } from '../common/composables/use-chrome';
import { PROFILE_KEY, resetProfileForTests, useProfile } from '../common/profile/use-profile';
import { createStorage } from '../common/storage';
import type { KeyValueStorage } from '../common/storage';
import { createFakeGame } from './fake-game';
import { usePlaySession } from './use-play-session';

function mountSession(gameId: string, level: string) {
  const id = ref(gameId);
  const ch = ref(level);
  const onAbort = vi.fn();
  let session!: ReturnType<typeof usePlaySession>;
  const wrapper = mount(
    defineComponent({
      setup() {
        session = usePlaySession(id, ch, onAbort);
        return () => null;
      },
    }),
    { global: { provide: { [gameRegistryKey as symbol]: createFakeGame().registry } } },
  );
  return { wrapper, session, id, ch, onAbort };
}

async function settled() {
  await vi.waitFor(() => expect(true).toBe(true));
  await flushPromises();
}

let store: KeyValueStorage;

beforeEach(() => {
  store = createStorage(null);
  resetProfileForTests(store);
});

async function ready(session: ReturnType<typeof usePlaySession>) {
  await vi.waitFor(() => expect(session.framed.value).not.toBeNull(), { timeout: 10_000 });
  await nextTick();
}

describe('usePlaySession', () => {
  it('sets an inline error for an unknown game', async () => {
    const { session } = mountSession('nope', 'a');
    await vi.waitFor(() => expect(session.error.value).toBe('Unknown game: nope'));
    expect(session.framed.value).toBeNull();
  });

  it('sets an inline error for an unknown level', async () => {
    const { session } = mountSession('fake', 'zzz');
    await vi.waitFor(() => expect(session.error.value).toBe('Unknown level: zzz'));
    expect(session.framed.value).toBeNull();
  });

  it('creates a round and runs, ends with the result, resets when leaving', async () => {
    const { wrapper, session } = mountSession('fake', 'a');
    await vi.waitFor(() => expect(session.framed.value).not.toBeNull(), { timeout: 10_000 });
    await nextTick();
    expect(session.error.value).toBeNull();
    expect(roundState.value).toBe('running');

    session.framed.value!.round.apply({ type: 'win' });
    await nextTick();
    expect(session.result.value).not.toBeNull();
    expect(roundState.value).toBe('ended');

    wrapper.unmount();
    expect(roundState.value).toBe('idle');
    await settled();
  });

  describe('recording results', () => {
    it('stores a won round with game, level, seed and scoring version', async () => {
      const { session } = mountSession('fake', 'a');
      await ready(session);
      session.framed.value!.round.apply({ type: 'win' });
      await nextTick();
      await nextTick();
      const { best } = useProfile();
      expect(best.value).toHaveLength(1);
      const seed = (session.framed.value!.round as unknown as { seed: number }).seed;
      expect(best.value[0]).toMatchObject({
        gameId: 'fake',
        level: 'a',
        seed,
        scoringVersion: 1,
        scoreValues: [100, 0],
      });
      expect(store.get(PROFILE_KEY)).not.toBeNull();
    });

    it('keeps the best result: worse does not replace, better does', async () => {
      const { session } = mountSession('fake', 'a');
      await ready(session);
      session.framed.value!.round.apply({ type: 'win', score: [50] });
      await nextTick();
      const { best } = useProfile();
      expect(best.value[0]!.scoreValues).toEqual([50]);
      const afterFirst = store.get(PROFILE_KEY);

      session.startRound();
      await nextTick();
      session.framed.value!.round.apply({ type: 'win', score: [10] });
      await nextTick();
      expect(best.value).toHaveLength(1);
      expect(best.value[0]!.scoreValues).toEqual([50]);
      expect(store.get(PROFILE_KEY)).toBe(afterFirst);

      session.startRound();
      await nextTick();
      session.framed.value!.round.apply({ type: 'win', score: [80] });
      await nextTick();
      expect(best.value).toHaveLength(1);
      expect(best.value[0]!.scoreValues).toEqual([80]);
      expect(store.get(PROFILE_KEY)).not.toBe(afterFirst);
    });

    it('stores nothing for a lost round', async () => {
      const { session } = mountSession('fake', 'a');
      await ready(session);
      session.framed.value!.round.apply({ type: 'lose' });
      await nextTick();
      expect(session.result.value?.roundEnd).toBe('lost');
      expect(useProfile().best.value).toHaveLength(0);
    });

    it('stores nothing for a discarded round', async () => {
      const { session } = mountSession('fake', 'a');
      await ready(session);
      session.discardRound();
      await nextTick();
      expect(useProfile().best.value).toHaveLength(0);
    });

    it('records once per result, even when other state changes', async () => {
      const { session } = mountSession('fake', 'a');
      await ready(session);
      const setSpy = vi.spyOn(store, 'set');
      session.framed.value!.round.apply({ type: 'win' });
      await nextTick();
      session.roundKey.value++;
      await nextTick();
      session.framed.value!.round.apply({ type: 'win' });
      await nextTick();
      expect(setSpy).toHaveBeenCalledTimes(1);
    });
  });
});
