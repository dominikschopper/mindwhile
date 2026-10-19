<script setup lang="ts">
import { HowToExample, HowToHeading, HowToMore, HowToParagraph } from '@mindwhile/game-kit'
import './styles/tokens.css'
import type { Board } from './board'
import { applyColor } from './flood'
import { marks } from './marks'
import { t } from './texts'

// Fixed 3x3 example with three colors, rendered statically.
const before: Board = { size: 3, cells: [0, 1, 1, 2, 0, 1, 2, 2, 0] }
const pickedColor = 1
const after = applyColor(before, pickedColor)

function rowLabel(board: Board, row: number): string {
  const rowMarks = board.cells
    .slice(row * board.size, (row + 1) * board.size)
    .map((c) => t(marks[c]!.nameKey))
  return t('howTo.example.row', { row: row + 1, marks: rowMarks.join(', ') })
}

function boardLabel(board: Board): string {
  return Array.from({ length: board.size }, (_, row) => rowLabel(board, row)).join('. ')
}
</script>

<template>
  <div class="how-to-play">
    <HowToParagraph>{{ t('howTo.rules.goal') }}</HowToParagraph>

    <HowToMore :more-label="t('howTo.more')" :less-label="t('howTo.less')">
      <HowToParagraph>{{ t('howTo.rules.pick') }}</HowToParagraph>
      <HowToParagraph>{{ t('howTo.rules.swallow') }}</HowToParagraph>

      <HowToHeading>{{ t('howTo.example.heading') }}</HowToHeading>
      <HowToExample :caption="t('howTo.example.before')">
        <div class="example-board" role="img" :aria-label="boardLabel(before)">
          <span
            v-for="(color, index) in before.cells"
            :key="index"
            :class="['example-cell', `cell--${color}`]"
            aria-hidden="true"
          >
            <component :is="marks[color]!.icon" class="mark-icon" aria-hidden="true" />
          </span>
        </div>
      </HowToExample>
      <HowToExample :caption="t('howTo.example.after', { mark: t(marks[pickedColor]!.nameKey) })">
        <div class="example-board" role="img" :aria-label="boardLabel(after)">
          <span
            v-for="(color, index) in after.cells"
            :key="index"
            :class="['example-cell', `cell--${color}`]"
            aria-hidden="true"
          >
            <component :is="marks[color]!.icon" class="mark-icon" aria-hidden="true" />
          </span>
        </div>
      </HowToExample>

      <HowToHeading>{{ t('howTo.counter.heading') }}</HowToHeading>
      <HowToParagraph>{{ t('howTo.counter.moves') }}</HowToParagraph>
      <HowToParagraph>{{ t('howTo.counter.par') }}</HowToParagraph>
      <HowToParagraph>{{ t('howTo.counter.approximation') }}</HowToParagraph>

      <HowToHeading>{{ t('howTo.score.heading') }}</HowToHeading>
      <HowToParagraph>{{ t('howTo.score.deviation') }}</HowToParagraph>
      <HowToParagraph>{{ t('howTo.score.negative') }}</HowToParagraph>

      <HowToHeading>{{ t('howTo.marks.heading') }}</HowToHeading>
      <HowToParagraph>{{ t('howTo.marks.text') }}</HowToParagraph>
    </HowToMore>
  </div>
</template>

<style scoped>
.example-board {
  display: grid;
  grid-template-columns: repeat(3, 3rem);
  gap: 1px;
  width: max-content;
  margin-inline: auto;
  background-color: var(--border-color);
  border: 1px solid var(--border-color);
}

.example-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 3rem;
}

.example-cell .mark-icon {
  width: 1.75rem;
  height: 1.75rem;
  stroke-width: 2.5;
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
</style>
