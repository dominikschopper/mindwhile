<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import {
  createLandingTimer,
  describePour,
  measureFlow,
  prefersReducedMotion,
  type Landing,
} from '../play/animation';
import TrayGlass from '../play/components/TrayGlass.vue';
import {
  createStepPlayer,
  DEMO_CAPACITY,
  DEMO_END,
  DEMO_FROM,
  DEMO_START,
  DEMO_STEPS,
  DEMO_TO,
  type DemoStepId,
} from './demo-loop';

// A decorative loop with the real glass: pick up the top block, pour it, reset. Not interactive,
// hidden from screen readers (the text next to it carries the meaning).
const reduced = prefersReducedMotion();

const root = ref<unknown>(null);
const trays = shallowRef<readonly (readonly number[])[]>(DEMO_START.trays);
const selected = ref<number | null>(null);
const landing = shallowRef<Landing | null>(null);
let landingKey = 0;

const landingTimer = createLandingTimer((phase) => {
  landing.value = phase === null || landing.value === null ? null : { ...landing.value, phase };
});

function show(step: DemoStepId): void {
  landingTimer.cancel();
  landing.value = null;
  if (step === 'start') {
    trays.value = DEMO_START.trays;
    selected.value = null;
  } else if (step === 'select') {
    trays.value = DEMO_START.trays;
    selected.value = DEMO_FROM;
  } else {
    const { moved, merged } = describePour(
      DEMO_START.trays[DEMO_FROM]!,
      DEMO_START.trays[DEMO_TO]!,
      DEMO_END.trays[DEMO_FROM]!.length,
    );
    const offset = measureFlow(root.value, DEMO_FROM, DEMO_TO) ?? { x: 0, y: 0 };
    selected.value = null;
    trays.value = DEMO_END.trays;
    landing.value = {
      tray: DEMO_TO,
      moved,
      merged,
      x: offset.x,
      y: offset.y,
      phase: 'flow',
      key: ++landingKey,
    };
    landingTimer.start(merged);
  }
}

const player = createStepPlayer(DEMO_STEPS, show);

onMounted(() => {
  if (!reduced) {
    player.start();
  }
});
onBeforeUnmount(() => {
  player.stop();
  landingTimer.cancel();
});
</script>

<template>
  <div ref="root" class="pour-demo" aria-hidden="true">
    <template v-if="reduced">
      <div
        v-for="board in [DEMO_START, DEMO_END]"
        :key="board === DEMO_START ? 'before' : 'after'"
        class="pour-demo__row pour-demo__static"
      >
        <TrayGlass
          v-for="(layers, index) in board.trays"
          :key="index"
          :layers="layers"
          :capacity="DEMO_CAPACITY"
          :selected="false"
          label=""
          disabled
        />
      </div>
    </template>
    <div v-else class="pour-demo__row">
      <TrayGlass
        v-for="(layers, index) in trays"
        :key="index"
        :layers="layers"
        :capacity="DEMO_CAPACITY"
        :selected="selected === index"
        :landing="landing !== null && landing.tray === index ? landing : null"
        label=""
        disabled
      />
    </div>
  </div>
</template>

<style scoped>
.pour-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding-top: 1.5rem;
}

.pour-demo__row {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: var(--spacing-md);
}
</style>
