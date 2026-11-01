<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import '../common/styles/tokens.css';
import '../common/styles/layout.css';
import '../common/styles/cell-colors.css';
import ColorBar from '../common/components/ColorBar.vue';
import { colorForKey, type ColorKeyEvent } from './keyboard';
import { marks } from '../common/board/marks';
import type { SpillItRound } from '../round/round';
import { t } from '../texts';
import { useSpillItRound } from './composables/use-spill-it-round';
import { waveDelayMs } from './wave-delay';

const props = defineProps<{ round: SpillItRound }>();

const { cells, size, colorCount, moveCount, par, regionColor, regionSize, solved, pick, lastPick } =
  useSpillItRound(props.round);

const glowClass = computed(() => {
  const pickInfo = lastPick.value;
  if (pickInfo === null) return null;
  return pickInfo.tick % 2 === 0 ? 'cell--glow-a' : 'cell--glow-b';
});

function cellClasses(color: number, index: number) {
  return ['cell', `cell--${color}`, index === 0 ? glowClass.value : null];
}

const boardLabel = computed(() => t('board.summary', { size, regionCount: regionSize.value }));

function onKeydown(event: ColorKeyEvent): void {
  const color = colorForKey(event, colorCount);
  if (color !== undefined) pick(color);
}

onMounted(() => globalThis.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => globalThis.removeEventListener('keydown', onKeydown));
</script>

<template>
  <section class="spill-it">
    <header class="spill-it-header">
      <p class="spill-it-moves" aria-live="polite">
        {{ t('counter.moves', { moves: moveCount }) }}
      </p>
      <p class="spill-it-par">{{ t('counter.par', { par }) }}</p>
    </header>

    <ColorBar
      :color-count="colorCount"
      :region-color="regionColor"
      :solved="solved"
      :pulse="lastPick ?? undefined"
      @pick="pick"
    />

    <div class="board" role="img" :aria-label="boardLabel" :style="{ '--size': size }">
      <span
        v-for="(color, index) in cells"
        :key="index"
        :class="cellClasses(color, index)"
        :style="{ '--wave-delay': `${waveDelayMs(index, size)}ms` }"
        :data-color="color"
        aria-hidden="true"
      >
        <component :is="marks[color]!.icon" class="mark-icon" aria-hidden="true" />
      </span>
    </div>

    <p v-if="solved" class="spill-it-solved" role="status">{{ t('round.solved') }}</p>
  </section>
</template>

<style scoped>
.spill-it-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--spacing-sm);
  color: var(--text-color);
}

.spill-it-moves,
.spill-it-par,
.spill-it-solved {
  margin: 0;
}

.spill-it-moves {
  font-weight: 700;
}

.spill-it-solved {
  font-weight: 700;
  color: var(--text-color);
}

.board {
  display: grid;
  grid-template-columns: repeat(var(--size), minmax(0, 1fr));
  gap: 1px;
  width: 100%;
  max-width: 30rem;
  aspect-ratio: 1;
  margin-inline: auto;
  container-type: inline-size;
  background-color: var(--border-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  overflow: hidden;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
  transition: background-color 360ms ease var(--wave-delay, 0ms);
}

/* The top left cell is where every move starts and glows once after each move. Two identical
   animations under different names: toggling between them restarts the glow on every move.
   Inset, because the board clips overflow. */
.cell--glow-a {
  animation: origin-glow-a 3000ms ease-out 1;
}

.cell--glow-b {
  animation: origin-glow-b 3000ms ease-out 1;
}

@keyframes origin-glow-a {
  from {
    box-shadow: inset 0 0 0 6px color-mix(in srgb, var(--glow-color) 55%, white);
  }
  to {
    box-shadow: inset 0 0 0 0 transparent;
  }
}

@keyframes origin-glow-b {
  from {
    box-shadow: inset 0 0 0 6px color-mix(in srgb, var(--glow-color) 55%, white);
  }
  to {
    box-shadow: inset 0 0 0 0 transparent;
  }
}

/* Icons follow the mark color and scale with the cell, like the text marks did. */
.cell .mark-icon {
  width: calc(50cqi / var(--size));
  height: calc(50cqi / var(--size));
  stroke-width: 2;
  opacity: var(--spill-it-mark-opacity);
}

@media (prefers-reduced-motion: reduce) {
  .cell {
    transition: none;
  }
}
</style>
