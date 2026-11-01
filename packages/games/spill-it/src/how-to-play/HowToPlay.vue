<script setup lang="ts">
import { HowToExample, HowToHeading, HowToParagraph, IconArrowRight } from '@mindwhile/game-kit';
import '../common/styles/tokens.css';
import '../common/styles/cell-colors.css';
import ColorBar from '../common/components/ColorBar.vue';
import type { Board } from '../common/board/board';
import { applyColor } from '../common/board/flood';
import { marks } from '../common/board/marks';
import { t } from '../texts';

// Fixed 3x3 example with three colors, rendered statically.
const before: Board = { size: 3, cells: [0, 1, 1, 2, 0, 1, 2, 2, 0] };
const colorCount = 3;
const pickedColor = 1;
const after = applyColor(before, pickedColor);
const nextColor = 2;
const third = applyColor(after, nextColor);

// Each step shows the board and the bar before a click, with the color to click highlighted.
// The second hint starts after the first one has finished pulsing.
const steps = [
  { board: before, hint: pickedColor, hintDelay: 0, caption: t('howTo.example.before') },
  {
    board: after,
    hint: nextColor,
    hintDelay: 3,
    caption: t('howTo.example.after', { mark: t(marks[pickedColor]!.nameKey) }),
  },
  {
    board: third,
    hint: undefined,
    hintDelay: 0,
    caption: t('howTo.example.third', { mark: t(marks[nextColor]!.nameKey) }),
  },
];

function rowLabel(board: Board, row: number): string {
  const rowMarks = board.cells
    .slice(row * board.size, (row + 1) * board.size)
    .map((c) => t(marks[c]!.nameKey));
  return t('howTo.example.row', { row: row + 1, marks: rowMarks.join(', ') });
}

function boardLabel(board: Board): string {
  return Array.from({ length: board.size }, (_, row) => rowLabel(board, row)).join('. ');
}
</script>

<template>
  <div class="how-to-play">
    <HowToParagraph>{{ t('howTo.rules.pick') }}</HowToParagraph>
    <HowToParagraph>{{ t('howTo.rules.swallow') }}</HowToParagraph>

    <HowToHeading>{{ t('howTo.example.heading') }}</HowToHeading>
    <div class="example-steps">
      <template v-for="(step, stepIndex) in steps" :key="stepIndex">
        <IconArrowRight v-if="stepIndex > 0" class="example-arrow" aria-hidden="true" />
        <HowToExample :caption="step.caption">
          <ColorBar
            decorative
            :color-count="colorCount"
            :region-color="step.board.cells[0]!"
            :hint="step.hint"
            :hint-delay="step.hintDelay"
          />
          <div class="example-board" role="img" :aria-label="boardLabel(step.board)">
            <span
              v-for="(color, index) in step.board.cells"
              :key="index"
              :class="[
                'example-cell',
                `cell--${color}`,
                { 'example-cell--target': index === 0 && step.hint !== undefined },
              ]"
              aria-hidden="true"
            >
              <component :is="marks[color]!.icon" class="mark-icon" aria-hidden="true" />
            </span>
          </div>
        </HowToExample>
      </template>
    </div>

    <HowToHeading>{{ t('howTo.counter.heading') }}</HowToHeading>
    <HowToParagraph>{{ t('howTo.counter.moves') }}</HowToParagraph>
    <HowToParagraph>{{ t('howTo.counter.par') }}</HowToParagraph>
    <HowToParagraph>{{ t('howTo.counter.approximation') }}</HowToParagraph>

    <HowToHeading>{{ t('howTo.score.heading') }}</HowToHeading>
    <HowToParagraph>{{ t('howTo.score.points') }}</HowToParagraph>
    <HowToParagraph>{{ t('howTo.score.negative') }}</HowToParagraph>

    <HowToHeading>{{ t('howTo.marks.heading') }}</HowToHeading>
    <HowToParagraph>{{ t('howTo.marks.text') }}</HowToParagraph>
  </div>
</template>

<style scoped>
.how-to-play {
  container-type: inline-size;
}

/* The steps side by side with an arrow between, stacked when the room is too small. Every box has
   the same content height, so with a top alignment they line up whatever the captions need. */
.example-steps {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xs);
}

.example-steps :deep(.how-to-example) {
  flex: 1 1 0;
  min-width: 0;
  margin: var(--spacing-sm) 0;
}

.example-steps :deep(.how-to-example-box) {
  padding: var(--spacing-sm);
}

.example-arrow {
  flex: none;
  align-self: center;
}

@container (max-width: 32rem) {
  .example-steps {
    flex-direction: column;
    align-items: center;
  }

  .example-arrow {
    rotate: 90deg;
  }
}

.example-board {
  display: grid;
  grid-template-columns: repeat(3, 2.5rem);
  gap: 1px;
  width: max-content;
  margin: var(--spacing-sm) auto 0;
  background-color: var(--border-color);
  border: 1px solid var(--border-color);
}

.example-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.5rem;
}

/* Where the next pick lands: a ring in the same color as the highlighted button. */
.example-cell--target {
  box-shadow:
    inset 0 0 0 2px var(--accent-color),
    inset 0 0 0 4px var(--surface-color);
}

.example-cell .mark-icon {
  width: 1.15rem;
  height: 1.15rem;
  stroke-width: 2;
  opacity: var(--spill-it-mark-opacity);
}
</style>
