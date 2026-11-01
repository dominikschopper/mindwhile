<script setup lang="ts">
import { computed } from 'vue';
import '../styles/tokens.css';
import '../styles/cell-colors.css';
import { marks } from '../board/marks';
import { t } from '../../texts';

/**
 * The color buttons of a round. With `decorative` it only draws them (for the rules example):
 * no buttons, no focus, hidden from screen readers. `hint` pulses one color to show which
 * one to pick.
 */
const props = defineProps<{
  colorCount: number;
  regionColor: number;
  solved?: boolean;
  hint?: number;
  /** Seconds to wait before the hint starts pulsing. */
  hintDelay?: number;
  decorative?: boolean;
  /** The last valid pick. The button of that color glows once; the parity of `tick` picks one of two identical animations so that every pick restarts it. */
  pulse?: { color: number; tick: number };
}>();

const emit = defineEmits<{ pick: [color: number] }>();

type ColorKey = `color.${0 | 1 | 2 | 3 | 4 | 5}`;

const colorIndexes = computed(() => Array.from({ length: props.colorCount }, (_, i) => i));

function buttonLabel(color: number): string {
  return t('colorButton.label', {
    color: t(`color.${color}` as ColorKey),
    mark: t(marks[color]!.nameKey),
  });
}

function glowClass(color: number): string | null {
  if (props.decorative || props.pulse === undefined || props.pulse.color !== color) return null;
  return props.pulse.tick % 2 === 0 ? 'color-button--glow-a' : 'color-button--glow-b';
}

function onClick(color: number): void {
  if (!props.decorative) emit('pick', color);
}
</script>

<template>
  <div
    :class="['color-bar', { 'color-bar--decorative': decorative }]"
    :style="{ '--hint-delay': `${hintDelay ?? 0}s` }"
  >
    <component
      :is="decorative ? 'span' : 'button'"
      v-for="color in colorIndexes"
      :key="color"
      :type="decorative ? undefined : 'button'"
      :class="[
        'color-button',
        `cell--${color}`,
        { 'color-button--hint': color === hint, 'color-button--current': color === regionColor },
        glowClass(color),
      ]"
      :data-color="color"
      :aria-label="decorative ? undefined : buttonLabel(color)"
      :aria-hidden="decorative ? 'true' : undefined"
      :disabled="decorative ? undefined : solved || color === regionColor"
      @click="onClick(color)"
    >
      <component :is="marks[color]!.icon" class="mark-icon" aria-hidden="true" />
    </component>
  </div>
</template>

<style scoped>
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
  text-align: center;
  border: 2px solid var(--border-color);
  border-radius: var(--radius);
  cursor: pointer;
}

.color-button .mark-icon {
  width: 1.25rem;
  height: 1.25rem;
  stroke-width: 2;
  opacity: var(--spill-it-mark-opacity);
}

.color-button:focus-visible {
  outline: 3px solid var(--focus-ring-color);
  outline-offset: 2px;
}

/* The current region color (or every color after solving): still clearly visible on
   the raised bar in both themes, marked by a dashed border in the text color. */
.color-button:disabled,
.color-button--current {
  cursor: not-allowed;
  opacity: 0.55;
  border: 2px dashed var(--text-color);
}

/* Drawn only, so it may be smaller than a touch target. */
.color-bar--decorative .color-button {
  min-width: 2rem;
  min-height: 2rem;
  cursor: default;
}

.color-bar--decorative .mark-icon {
  width: 1.25rem;
  height: 1.25rem;
  stroke-width: 2;
  opacity: var(--spill-it-mark-opacity);
}

/* The ring appears and disappears three times, then stays as a steady hint. Before a delayed
   start the first keyframe (no ring) applies. */
.color-button--hint {
  box-shadow:
    0 0 0 3px var(--surface-color),
    0 0 0 6px var(--accent-color);
  animation: hint-pulse 0.8s ease-in-out var(--hint-delay, 0s) 3 backwards;
}

@keyframes hint-pulse {
  0%,
  100% {
    box-shadow:
      0 0 0 0 transparent,
      0 0 0 0 transparent;
  }
  50% {
    box-shadow:
      0 0 0 3px var(--surface-color),
      0 0 0 6px var(--accent-color);
  }
}

/* Two identical animations under different names: toggling between them restarts the glow.
   The picked button is disabled at once (opacity 0.55), so the animation sets its own opacity:
   full at the start, easing down to the resting value. */
.color-button--glow-a {
  animation: pick-glow-a 3000ms ease-out 1;
}

.color-button--glow-b {
  animation: pick-glow-b 3000ms ease-out 1;
}

@keyframes pick-glow-a {
  0% {
    opacity: 1;
    box-shadow:
      0 0 0 3px var(--surface-color),
      0 0 0 6px var(--glow-color),
      0 0 14px 8px var(--glow-color);
  }
  100% {
    opacity: 0.55;
    box-shadow:
      0 0 0 0 transparent,
      0 0 0 0 transparent,
      0 0 0 0 transparent;
  }
}

@keyframes pick-glow-b {
  0% {
    opacity: 1;
    box-shadow:
      0 0 0 3px var(--surface-color),
      0 0 0 6px var(--glow-color),
      0 0 14px 8px var(--glow-color);
  }
  100% {
    opacity: 0.55;
    box-shadow:
      0 0 0 0 transparent,
      0 0 0 0 transparent,
      0 0 0 0 transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .color-button--hint {
    animation: none;
  }
}
</style>
