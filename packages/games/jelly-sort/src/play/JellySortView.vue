<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import '../common/styles/tokens.css';
import { marks } from '../common/board/marks';
import type { JellySortRound } from '../round/round';
import { t } from '../texts';
import TrayGlass from './components/TrayGlass.vue';
import { useJellySortRound, type TapFeedback } from './composables/use-jelly-sort-round';
import {
  createLandingTimer,
  describePour,
  measureFlow,
  prefersReducedMotion,
  type Landing,
} from './animation';
import { focusTray, listenForTrayKeys, moveCursor, type TrayKeyAction } from './keyboard';

const props = defineProps<{ round: JellySortRound }>();

const { trays, capacity, moveCount, par, selected, feedback, result, tap } = useJellySortRound(
  props.round,
);

// The section element, only handed to the focus helper.
const root = ref<unknown>(null);
// Tray the keyboard acts on, null until the keyboard is used or a tray is tapped.
const cursor = shallowRef<number | null>(null);

function trayLabel(layers: readonly number[], index: number): string {
  const position = index + 1;
  if (layers.length === 0) {
    return t('tray.labelEmpty', { position });
  }
  const described = layers.map((color) =>
    t('tray.layer', {
      color: t(`color.${color}` as 'color.0'),
      mark: t(marks[color]!.nameKey),
    }),
  );
  return t('tray.label', {
    position,
    filled: layers.length,
    capacity,
    layers: described.join(', '),
  });
}

function describe(event: TapFeedback): string {
  switch (event.kind) {
    case 'selected':
      return t('live.selected', { position: event.tray + 1 });
    case 'cancelled':
      return t('live.cancelled');
    case 'invalid':
      return t('live.invalid', { from: event.from + 1, to: event.to + 1 });
    case 'poured':
      return t('live.poured', { from: event.from + 1, to: event.to + 1, moves: moveCount.value });
  }
}

const liveText = computed(() => {
  const outcome = result.value;
  if (outcome?.roundEnd === 'won') {
    return t('live.won', { moves: moveCount.value });
  }
  if (outcome?.roundEnd === 'lost') {
    return t('live.lost');
  }
  return feedback.value === null ? '' : describe(feedback.value);
});

// The block that just landed, kept for a moment so the tray can play flow and merge.
const landing = shallowRef<Landing | null>(null);
const landingTimer = createLandingTimer(() => {
  landing.value = null;
});
let landingKey = 0;

// Taps through here so a pour can be turned into a landing. The state changes at once,
// the animation only follows and never blocks input.
function tapTray(index: number): void {
  const from = selected.value;
  const sourceBefore = from === null ? [] : [...trays.value[from]!];
  const targetBefore = [...(trays.value[index] ?? [])];
  const movesBefore = moveCount.value;
  tap(index);
  if (from === null || moveCount.value === movesBefore || prefersReducedMotion()) {
    return;
  }
  const { moved, merged } = describePour(sourceBefore, targetBefore, trays.value[from]!.length);
  const offset = measureFlow(root.value, from, index) ?? { x: 0, y: 0 };
  landing.value = { tray: index, moved, merged, x: offset.x, y: offset.y, key: ++landingKey };
  landingTimer.start();
}

function onTap(index: number): void {
  cursor.value = index;
  tapTray(index);
}

function onKey(action: TrayKeyAction): void {
  const count = trays.value.length;
  if (action.type === 'tap') {
    if (cursor.value !== null) {
      tapTray(cursor.value);
    }
    return;
  }
  if (action.type === 'move') {
    const from = cursor.value ?? (action.delta === 1 ? -1 : 0);
    cursor.value = moveCursor(from, action.delta, count);
  } else {
    cursor.value = action.index;
  }
  focusTray(root.value, cursor.value);
}

let stopKeys: (() => void) | undefined;
onMounted(() => {
  stopKeys = listenForTrayKeys(trays.value.length, onKey);
});
onBeforeUnmount(() => {
  stopKeys?.();
  landingTimer.cancel();
});
</script>

<template>
  <section ref="root" class="jelly-sort">
    <header class="jelly-sort-header">
      <p class="jelly-sort-moves">{{ t('counter.moves', { moves: moveCount }) }}</p>
      <p class="jelly-sort-par">{{ t('counter.par', { par }) }}</p>
    </header>

    <div class="jelly-sort-trays" role="group" :aria-label="t('board.label')">
      <TrayGlass
        v-for="(layers, index) in trays"
        :key="index"
        :layers="layers"
        :capacity="capacity"
        :selected="selected === index"
        :landing="landing !== null && landing.tray === index ? landing : null"
        :label="trayLabel(layers, index)"
        @select="onTap(index)"
      />
    </div>

    <p class="jelly-sort-live" role="status" aria-live="polite">{{ liveText }}</p>
  </section>
</template>

<style scoped>
.jelly-sort {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--spacing-md);
  width: 100%;
  max-width: 30rem;
  margin-inline: auto;
  padding: var(--spacing-md);
  box-sizing: border-box;
}

.jelly-sort-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--spacing-sm);
  color: var(--text-color);
}

.jelly-sort-moves,
.jelly-sort-par,
.jelly-sort-live {
  margin: 0;
}

.jelly-sort-moves {
  font-weight: 700;
}

.jelly-sort-trays {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-end;
  gap: var(--spacing-md);
  padding-top: 1.5rem;
}

.jelly-sort-live {
  min-height: 1.5em;
  color: var(--text-color);
}
</style>
