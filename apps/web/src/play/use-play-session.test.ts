// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { gameRegistryKey } from '../common/composables/game-registry'
import { roundState } from '../common/composables/use-chrome'
import { createFakeGame } from './fake-game'
import { usePlaySession } from './use-play-session'

function mountSession(gameId: string, level: string) {
  const id = ref(gameId)
  const ch = ref(level)
  const onAbort = vi.fn()
  let session!: ReturnType<typeof usePlaySession>
  const wrapper = mount(
    defineComponent({
      setup() {
        session = usePlaySession(id, ch, onAbort)
        return () => null
      },
    }),
    { global: { provide: { [gameRegistryKey as symbol]: createFakeGame().registry } } },
  )
  return { wrapper, session, id, ch, onAbort }
}

async function settled() {
  await vi.waitFor(() => expect(true).toBe(true))
  await flushPromises()
}

describe('usePlaySession', () => {
  it('sets an inline error for an unknown game', async () => {
    const { session } = mountSession('nope', 'a')
    await vi.waitFor(() => expect(session.error.value).toBe('Unknown game: nope'))
    expect(session.framed.value).toBeNull()
  })

  it('sets an inline error for an unknown level', async () => {
    const { session } = mountSession('fake', 'zzz')
    await vi.waitFor(() => expect(session.error.value).toBe('Unknown level: zzz'))
    expect(session.framed.value).toBeNull()
  })

  it('creates a round and runs, ends with the result, resets when leaving', async () => {
    const { wrapper, session } = mountSession('fake', 'a')
    await vi.waitFor(() => expect(session.framed.value).not.toBeNull(), { timeout: 10_000 })
    await nextTick()
    expect(session.error.value).toBeNull()
    expect(roundState.value).toBe('running')

    session.framed.value!.round.apply({ type: 'win' })
    await nextTick()
    expect(session.result.value).not.toBeNull()
    expect(roundState.value).toBe('ended')

    wrapper.unmount()
    expect(roundState.value).toBe('idle')
    await settled()
  })
})
