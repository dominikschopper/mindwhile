import { newSeed } from '@mindwhile/core'
import type { GameModule, Round } from '@mindwhile/core'
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import type { Component, Ref } from 'vue'
import { useGameRegistry } from '../common/composables/game-registry'
import { registerAbortHandler, setRoundState } from '../common/composables/use-chrome'
import { showNotice } from '../common/composables/use-notice'
import { t as commonT } from '../common/texts'
import { useRoundFrame } from './use-round-frame'
import { t } from './texts'

// Loads the game module, validates game and level, owns the current round and
// drives the shell state. `onAbortRequest` is called when the shell asks to abort.
export function usePlaySession(
  gameId: Ref<string>,
  level: Ref<string>,
  onAbortRequest: () => void,
  onRoundFailed: () => void = () => {},
) {
  const registry = useGameRegistry()
  const module = shallowRef<GameModule<Component> | null>(null)
  const error = ref<string | null>(null)
  const framed = shallowRef<ReturnType<typeof useRoundFrame<Round>> | null>(null)
  const roundKey = ref(0)

  const result = computed(() => framed.value?.result.value ?? null)

  // Error guard: an error in the game discards the round (no result), resets the shell,
  // shows a one-time notice and leaves the play page.
  function failRound(cause: unknown): void {
    console.error(cause)
    framed.value = null
    module.value = null
    setRoundState('idle')
    registerAbortHandler(null)
    showNotice(commonT('notice.roundDiscarded'))
    onRoundFailed()
  }

  function startRound(): void {
    const loaded = module.value
    if (!loaded) return
    try {
      framed.value = useRoundFrame(loaded.createRound({ level: level.value, seed: newSeed() }))
    } catch (cause) {
      failRound(cause)
      return
    }
    roundKey.value++
  }

  function discardRound(): void {
    framed.value = null
  }

  async function load(): Promise<void> {
    module.value = null
    framed.value = null
    error.value = null
    const game = registry.getGame(gameId.value)
    if (!game) {
      error.value = t('error.unknownGame', { game: gameId.value })
      return
    }
    let loaded: GameModule<Component>
    try {
      loaded = await game.loadModule()
    } catch (cause) {
      failRound(cause)
      return
    }
    if (!loaded.manifest.levels.includes(level.value)) {
      error.value = t('error.unknownLevel', { level: level.value })
      return
    }
    module.value = loaded
    startRound()
  }

  watch(() => [gameId.value, level.value], load, { immediate: true })

  // Drive the shell: running while a round is open, ended once the result is there.
  watch(
    [framed, result],
    () => {
      if (!framed.value) {
        setRoundState('idle')
        registerAbortHandler(null)
      } else if (result.value) {
        setRoundState('ended')
        registerAbortHandler(null)
      } else {
        setRoundState('running')
        registerAbortHandler(onAbortRequest)
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    setRoundState('idle')
    registerAbortHandler(null)
  })

  const scoreText = computed(() => {
    const score = result.value?.score
    if (!score) return ''
    return registry.getGame(gameId.value)?.texts.formatScore(score) ?? score.join(' ')
  })

  return { module, error, framed, roundKey, result, scoreText, startRound, discardRound, failRound }
}
