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

const props = defineProps<{ round: SpillItRound }>();

const { cells, size, colorCount, moveCount, par, regionColor, regionSize, solved, pick } =
  useSpillItRound(props.round);

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

    <ColorBar :color-count="colorCount" :region-color="regionColor" :solved="solved" @pick="pick" />

    <div class="board" role="img" :aria-label="boardLabel" :style="{ '--size': size }">
      <span
        v-for="(color, index) in cells"
        :key="index"
        :class="['cell', `cell--${color}`, { 'cell--origin': index === 0 }]"
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
  transition: background-color 150ms ease;
}

/* The top left cell is where every move starts: a semi-transparent frame in the mark color
   (always readable on this cell's color) shows which cell it is. */
.cell--origin {
  box-shadow: inset 0 0 0 3px color-mix(in srgb, currentColor 60%, transparent);
}

/* Icons follow the mark color and scale with the cell, like the text marks did. */
.cell .mark-icon {
  width: calc(65cqi / var(--size));
  height: calc(65cqi / var(--size));
  stroke-width: 2.5;
}

@media (prefers-reduced-motion: reduce) {
  .cell {
    transition: none;
  }
}
</style>
