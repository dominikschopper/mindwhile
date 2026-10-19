<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import './styles/tokens.css'
import './styles/layout.css'
import { marks } from './marks'
import type { SpillItRound } from './round'
import { t } from './texts'
import { useSpillItRound } from './use-spill-it-round'

const props = defineProps<{ round: SpillItRound }>()

const { cells, size, colorCount, moveCount, par, regionColor, regionSize, solved, pick } =
  useSpillItRound(props.round)

type ColorKey = `color.${1 | 2 | 3 | 4 | 5 | 6}`

function colorName(color: number): string {
  return t(`color.${color + 1}` as ColorKey)
}

const colorIndexes = computed(() => Array.from({ length: colorCount }, (_, i) => i))

const boardLabel = computed(() => t('board.summary', { size, regionCount: regionSize.value }))

function buttonLabel(color: number): string {
  return t('colorButton.label', { color: colorName(color), mark: marks[color]! })
}

function onKeydown(event: {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
}): void {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
  if (!/^[1-9]$/.test(event.key)) return
  const color = Number(event.key) - 1
  if (color < colorCount) pick(color)
}

onMounted(() => globalThis.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => globalThis.removeEventListener('keydown', onKeydown))
</script>

<template>
  <section class="spill-it">
    <header class="spill-it-header">
      <p class="spill-it-moves" aria-live="polite">
        {{ t('counter.moves', { moves: moveCount }) }}
      </p>
      <p class="spill-it-par">{{ t('counter.par', { par }) }}</p>
    </header>

    <div class="color-bar">
      <button
        v-for="color in colorIndexes"
        :key="color"
        type="button"
        :class="['color-button', `cell--${color}`]"
        :data-color="color"
        :aria-label="buttonLabel(color)"
        :disabled="solved || color === regionColor"
        @click="pick(color)"
      >
        {{ marks[color] }}
      </button>
    </div>

    <div class="board" role="img" :aria-label="boardLabel" :style="{ '--size': size }">
      <span
        v-for="(color, index) in cells"
        :key="index"
        :class="['cell', `cell--${color}`]"
        :data-color="color"
        aria-hidden="true"
        >{{ marks[color] }}</span
      >
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
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  font-weight: 700;
  line-height: 1;
  font-size: calc(55cqi / var(--size));
  transition: background-color 150ms ease;
}

.cell--0 {
  background-color: var(--spill-it-color-0);
  color: var(--spill-it-mark-0);
}
.cell--1 {
  background-color: var(--spill-it-color-1);
  color: var(--spill-it-mark-1);
}
.cell--2 {
  background-color: var(--spill-it-color-2);
  color: var(--spill-it-mark-2);
}
.cell--3 {
  background-color: var(--spill-it-color-3);
  color: var(--spill-it-mark-3);
}
.cell--4 {
  background-color: var(--spill-it-color-4);
  color: var(--spill-it-mark-4);
}
.cell--5 {
  background-color: var(--spill-it-color-5);
  color: var(--spill-it-mark-5);
}

.color-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--spill-it-bar-color);
  border-radius: var(--radius);
}

.color-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--button-min-size);
  min-height: var(--button-min-size);
  padding: 0;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  font-weight: 700;
  font-size: 1.25rem;
  line-height: 1;
  text-align: center;
  border: 2px solid var(--border-color);
  border-radius: var(--radius);
  cursor: pointer;
}

.color-button:focus-visible {
  outline: 3px solid var(--focus-ring-color);
  outline-offset: 2px;
}

/* The current region color (or every color after solving): still clearly visible on
   the raised bar in both themes, marked by a dashed border in the text color. */
.color-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  border: 2px dashed var(--text-color);
}

@media (prefers-reduced-motion: reduce) {
  .cell {
    transition: none;
  }
}
</style>
