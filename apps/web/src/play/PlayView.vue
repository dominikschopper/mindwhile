<script setup lang="ts">
import {
  AppButton,
  createLayerRegistry,
  provideActivity,
  provideLayers,
} from '@mindwhile/game-kit';
import { onErrorCaptured, ref, toRef } from 'vue';
import { RouterLink, onBeforeRouteLeave, useRouter } from 'vue-router';
import { roundState, setRoundState } from '../common/composables/use-chrome';
import AbortDialog from './AbortDialog.vue';
import { usePageActivity } from './use-page-activity';
import { usePlaySession } from './use-play-session';
import { t } from './texts';

const props = defineProps<{ gameId: string; level: string }>();
const router = useRouter();
const activity = usePageActivity();
provideActivity(activity);
const layers = createLayerRegistry();
provideLayers(layers);
const abortDialog = ref<InstanceType<typeof AbortDialog> | null>(null);

const { module, error, framed, roundKey, result, scoreText, startRound, discardRound, failRound } =
  usePlaySession(
    toRef(props, 'gameId'),
    toRef(props, 'level'),
    () => void router.push(gamePage()),
    () => void router.replace('/'),
  );

// Error guard for the game's view and its descendants.
onErrorCaptured((cause) => {
  failRound(cause);
  return false;
});

function gamePage(): string {
  return `/games/${props.gameId}`;
}

// One shared question while the dialog is open: a second navigation waits for the same answer.
let pendingAnswer: Promise<boolean> | null = null;
let answer: ((confirmed: boolean) => void) | null = null;

function askAbort(): Promise<boolean> {
  if (!pendingAnswer) {
    pendingAnswer = new Promise<boolean>((resolve) => {
      answer = resolve;
    });
    void abortDialog.value?.open();
  }
  return pendingAnswer;
}

function settle(confirmed: boolean): void {
  const resolve = answer;
  pendingAnswer = null;
  answer = null;
  resolve?.(confirmed);
}

// Leave guard: an open game layer closes first. Then only a running round asks. Confirm discards the round and goes to the game page
// (also for links and the back button). The state is idle before the redirect, so it passes.
onBeforeRouteLeave(async (to) => {
  // A game layer (the pause) closes first and cancels this navigation.
  if (layers.closeTopmost()) {
    return false;
  }
  if (roundState.value !== 'running') {
    return true;
  }
  if (!(await askAbort())) {
    return false;
  }
  discardRound();
  setRoundState('idle');
  return to.path === gamePage() ? true : gamePage();
});
</script>

<template>
  <section v-if="error" role="alert">
    <h1>{{ t('error.heading') }}</h1>
    <p>{{ error }}</p>
    <RouterLink to="/">{{ t('error.link') }}</RouterLink>
  </section>

  <p v-else-if="!module || !framed">{{ t('loading') }}</p>

  <template v-else>
    <!-- The lost panel lies centered over the board, so the board stays visible behind it. -->
    <div class="play-stage">
      <component :is="module.View" :key="roundKey" :round="framed.round" />

      <section v-if="result?.roundEnd === 'lost'" class="result lost" role="status">
        <div class="lost-message">
          <h2>{{ t('lost.heading') }}</h2>
          <p>{{ t('lost.text') }}</p>
        </div>
        <div class="play-actions">
          <AppButton variant="primary" @click="startRound">{{ t('result.next') }}</AppButton>
        </div>
      </section>
    </div>

    <section v-if="result && result.roundEnd !== 'lost'" class="result" role="status">
      <h2>{{ t('result.heading') }}</h2>
      <p class="result-score">{{ scoreText }}</p>
      <div class="play-actions">
        <AppButton variant="primary" @click="startRound">{{ t('result.next') }}</AppButton>
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

.play-stage {
  position: relative;
}

/* Lost: centered over the board with a very transparent background, the board shows through. */
.result.lost {
  position: absolute;
  inset: 0;
  z-index: 5;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #000;
  border-radius: var(--radius-lg);
}

.result.lost > * {
  position: relative;
}

/* The same rainbow as the backdrop of the dialogs (AppDialog), on a layer behind the text so
   the hue shift does not tint the text. It runs a few seconds and stops, not with reduced motion. */
.result.lost::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: var(--radius-lg);
  background: linear-gradient(
    135deg,
    hsl(0 85% 55% / 0.55),
    hsl(60 85% 55% / 0.55),
    hsl(120 85% 45% / 0.55),
    hsl(200 85% 55% / 0.55),
    hsl(280 85% 55% / 0.55)
  );
}

@media (prefers-reduced-motion: no-preference) {
  .result.lost::before {
    animation: lost-rainbow 4s linear 2;
  }
}

@keyframes lost-rainbow {
  to {
    filter: hue-rotate(360deg);
  }
}

/* The text box on the rainbow: a grey, semi-transparent card. Darker in the light theme so the
   black text and the card stand out from the page, the original light grey in the dark theme. */
.lost-message {
  padding: 0.75rem;
  margin-block-end: 1rem;
  border-radius: 1rem;
  background-color: light-dark(rgb(205 205 205 / 0.75), rgb(250 250 250 / 0.67));
}

.result.lost .play-actions {
  justify-content: center;
}

.result-score {
  font-weight: 700;
}
</style>
