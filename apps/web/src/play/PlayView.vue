<script setup lang="ts">
import { newSeed } from '@mindwhile/core'
import type { Round } from '@mindwhile/core'
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import ThemeSwitch from '../common/components/ThemeSwitch.vue'
import { loadGameModule } from '../common/composables/load-game-module'
import type { LoadedGameModule } from '../common/composables/load-game-module'
import { useRoundFrame } from './use-round-frame'
import { t } from './texts'

const props = defineProps<{ gameId: string; challenge: string }>()
const router = useRouter()

const module = shallowRef<LoadedGameModule | null>(null)
const error = ref<string | null>(null)
const framed = shallowRef<ReturnType<typeof useRoundFrame<Round>> | null>(null)
const roundKey = ref(0)
const dialog = ref<{ showModal(): void; close(): void } | null>(null)

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

const scoreText = computed(() => {
  const score = result.value?.score
  if (!score) return ''
  return module.value?.formatScore?.(score) ?? score.join(' ')
})

async function openHelp(): Promise<void> {
  await nextTick()
  dialog.value?.showModal()
}

function closeHelp(): void {
  dialog.value?.close()
}

function back(): void {
  void router.push('/')
}
</script>

<template>
  <main class="page">
    <header class="page-header">
      <button type="button" @click="back">{{ t('page.back') }}</button>
      <div class="play-actions">
        <button v-if="module" type="button" @click="openHelp">{{ t('help.open') }}</button>
        <ThemeSwitch />
      </div>
    </header>

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
          <button type="button" @click="back">{{ t('result.back') }}</button>
        </div>
      </section>

      <dialog v-if="module" ref="dialog" class="help" @keydown.esc.prevent="closeHelp">
        <component :is="module.HowToPlay" />
        <button type="button" @click="closeHelp">{{ t('help.close') }}</button>
      </dialog>
    </template>
  </main>
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
