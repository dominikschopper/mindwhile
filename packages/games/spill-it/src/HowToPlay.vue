<script setup lang="ts">
import { HowToExample, HowToHeading, HowToParagraph } from '@mindwhile/game-kit'
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
  const rowMarks = board.cells.slice(row * board.size, (row + 1) * board.size).map((c) => marks[c]!)
  return t('howTo.example.row', { row: row + 1, marks: rowMarks.join(' ') })
}

function boardLabel(board: Board): string {
  return Array.from({ length: board.size }, (_, row) => rowLabel(board, row)).join('. ')
}
</script>

<template>
  <div class="how-to-play">
    <HowToHeading>{{ t('howTo.rules.heading') }}</HowToHeading>
    <HowToParagraph>{{ t('howTo.rules.pick') }}</HowToParagraph>
    <HowToParagraph>{{ t('howTo.rules.swallow') }}</HowToParagraph>
    <HowToParagraph>{{ t('howTo.rules.goal') }}</HowToParagraph>

    <HowToHeading>{{ t('howTo.example.heading') }}</HowToHeading>
    <HowToExample :caption="t('howTo.example.before')">
      <div class="example-board" role="img" :aria-label="boardLabel(before)">
        <span
          v-for="(color, index) in before.cells"
          :key="index"
          :class="['example-cell', `cell--${color}`]"
          aria-hidden="true"
          >{{ marks[color] }}</span
        >
      </div>
    </HowToExample>
    <HowToExample :caption="t('howTo.example.after', { mark: marks[pickedColor]! })">
      <div class="example-board" role="img" :aria-label="boardLabel(after)">
        <span
          v-for="(color, index) in after.cells"
          :key="index"
          :class="['example-cell', `cell--${color}`]"
          aria-hidden="true"
          >{{ marks[color] }}</span
        >
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
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  font-weight: 700;
  font-size: 1.5rem;
  line-height: 1;
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
