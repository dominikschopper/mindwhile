<script setup lang="ts">
import { newSeed } from '@mindwhile/core'
import type { Round } from '@mindwhile/core'
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { loadGameModule } from '../common/composables/load-game-module'
import type { LoadedGameModule } from '../common/composables/load-game-module'
import { registerAbortHandler, setRoundState } from '../common/composables/use-chrome'
import { useRoundFrame } from './use-round-frame'
import { t } from './texts'

const props = defineProps<{ gameId: string; challenge: string }>()
const router = useRouter()

const module = shallowRef<LoadedGameModule | null>(null)
const error = ref<string | null>(null)
const framed = shallowRef<ReturnType<typeof useRoundFrame<Round>> | null>(null)
const roundKey = ref(0)
const abortDialog = ref<{ showModal(): void; close(): void } | null>(null)

const result = computed(() => framed.value?.result.value ?? null)

function startRound(): void {
  const loaded = module.value
  if (!loaded) return
  framed.value = useRoundFrame(loaded.createRound({ challenge: props.challenge, seed: newSeed() }))
  roundKey.value++
}

async function load(): Promise<void> {
  module.value = null
  framed.value = null
  error.value = null
  let loaded: LoadedGameModule
  try {
    loaded = await loadGameModule(props.gameId)
  } catch {
    error.value = t('error.unknownGame', { game: props.gameId })
    return
  }
  if (!loaded.manifest.challenges.includes(props.challenge)) {
    error.value = t('error.unknownChallenge', { challenge: props.challenge })
    return
  }
  module.value = loaded
  startRound()
}

watch(() => [props.gameId, props.challenge], load, { immediate: true })

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
      registerAbortHandler(openAbort)
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
  return module.value?.formatScore?.(score) ?? score.join(' ')
})

async function openAbort(): Promise<void> {
  await nextTick()
  abortDialog.value?.showModal()
}

function keepPlaying(): void {
  abortDialog.value?.close()
}

function confirmAbort(): void {
  abortDialog.value?.close()
  framed.value = null
  void router.push(`/games/${props.gameId}`)
}
</script>

<template>
  <section v-if="error" role="alert">
    <h1>{{ t('error.heading') }}</h1>
    <p>{{ error }}</p>
    <RouterLink to="/">{{ t('error.link') }}</RouterLink>
  </section>

  <p v-else-if="!module || !framed">{{ t('loading') }}</p>

  <template v-else>
    <component :is="module.View" :key="roundKey" :round="framed.round" />

    <section v-if="result" class="result" role="status">
      <h2>{{ t('result.heading') }}</h2>
      <p class="result-score">{{ scoreText }}</p>
      <div class="play-actions">
        <button type="button" @click="startRound">{{ t('result.next') }}</button>
      </div>
    </section>

    <dialog
      ref="abortDialog"
      class="abort-dialog"
      @keydown.esc.prevent="keepPlaying"
      @cancel.prevent="keepPlaying"
    >
      <h2>{{ t('abort.heading') }}</h2>
      <p>{{ t('abort.text') }}</p>
      <div class="play-actions">
        <button type="button" class="abort-confirm" @click="confirmAbort">
          {{ t('abort.confirm') }}
        </button>
        <button type="button" class="abort-cancel" @click="keepPlaying">
          {{ t('abort.cancel') }}
        </button>
      </div>
    </dialog>
  </template>
</template>

<style scoped>
.play-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.result {
  margin-block-start: var(--spacing-lg);
}

.result-score {
  font-weight: 700;
}
</style>
