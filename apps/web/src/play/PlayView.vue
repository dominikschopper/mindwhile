<script setup lang="ts">
import { onErrorCaptured, ref, toRef } from 'vue'
import { RouterLink, onBeforeRouteLeave, useRouter } from 'vue-router'
import { roundState, setRoundState } from '../common/composables/use-chrome'
import AbortDialog from './AbortDialog.vue'
import { usePlaySession } from './use-play-session'
import { t } from './texts'

const props = defineProps<{ gameId: string; level: string }>()
const router = useRouter()
const abortDialog = ref<InstanceType<typeof AbortDialog> | null>(null)

const { module, error, framed, roundKey, result, scoreText, startRound, discardRound, failRound } =
  usePlaySession(
    toRef(props, 'gameId'),
    toRef(props, 'level'),
    () => void router.push(gamePage()),
    () => void router.replace('/'),
  )

// Error guard for the game's view and its descendants.
onErrorCaptured((cause) => {
  failRound(cause)
  return false
})

function gamePage(): string {
  return `/games/${props.gameId}`
}

// One shared question while the dialog is open: a second navigation waits for the same answer.
let pendingAnswer: Promise<boolean> | null = null
let answer: ((confirmed: boolean) => void) | null = null

function askAbort(): Promise<boolean> {
  if (!pendingAnswer) {
    pendingAnswer = new Promise<boolean>((resolve) => {
      answer = resolve
    })
    void abortDialog.value?.open()
  }
  return pendingAnswer
}

function settle(confirmed: boolean): void {
  const resolve = answer
  pendingAnswer = null
  answer = null
  resolve?.(confirmed)
}

// Leave guard: only a running round asks. Confirm discards the round and goes to the game page
// (also for links and the back button). The state is idle before the redirect, so it passes.
onBeforeRouteLeave(async (to) => {
  if (roundState.value !== 'running') return true
  if (!(await askAbort())) return false
  discardRound()
  setRoundState('idle')
  return to.path === gamePage() ? true : gamePage()
})
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

    <AbortDialog ref="abortDialog" @confirm="settle(true)" @cancel="settle(false)" />
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
