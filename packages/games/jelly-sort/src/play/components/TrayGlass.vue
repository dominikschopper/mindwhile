<script setup lang="ts">
import { computed } from 'vue';
import '../../common/styles/tokens.css';
import '../../common/styles/jelly-colors.css';
import { marks } from '../../common/board/marks';
import { prefersReducedMotion, type Landing } from '../animation';
import { topBlockStart } from './tray-glass';

/**
 * One tray as an open lab glass. `layers` run from the bottom to the top (color indexes).
 * The label is the accessible name and is built by the caller.
 */
const props = defineProps<{
  layers: readonly number[];
  capacity: number;
  selected: boolean;
  label: string;
  disabled?: boolean;
  /** The block that just landed in this tray, null when none. */
  landing?: Landing | null;
}>();

const emit = defineEmits<{ select: [] }>();

const liftedFrom = computed(() => (props.selected ? topBlockStart(props.layers) : -1));

// Read when the selection changes, so a changed preference applies to the next selection.
const wobbling = computed(() => props.selected && !prefersReducedMotion());

function landed(index: number): boolean {
  const landing = props.landing;
  return landing != null && index >= props.layers.length - landing.moved;
}

// Equal colors that touch fuse into one layer, so the touching corners are square.
function joinsBelow(index: number): boolean {
  return index > 0 && props.layers[index - 1] === props.layers[index];
}
function joinsAbove(index: number): boolean {
  return index < props.layers.length - 1 && props.layers[index + 1] === props.layers[index];
}

const flowStyle = computed(() =>
  props.landing ? { '--flow-x': `${props.landing.x}px`, '--flow-y': `${props.landing.y}px` } : {},
);
</script>

<template>
  <button
    type="button"
    :class="['tray-glass', { 'tray-glass--selected': selected }]"
    :style="{ '--capacity': capacity, ...flowStyle }"
    :aria-label="label"
    :aria-pressed="selected"
    :disabled="disabled"
    @click="emit('select')"
  >
    <span class="tray-glass__inner">
      <span
        v-for="(color, index) in layers"
        :key="index"
        :class="[
          'tray-glass__layer',
          `jelly--${color}`,
          {
            'tray-glass__layer--lifted': liftedFrom >= 0 && index >= liftedFrom,
            'tray-glass__layer--wobble': wobbling && liftedFrom >= 0 && index >= liftedFrom,
            'tray-glass__layer--flow': landed(index),
            'tray-glass__layer--merge': landed(index) && landing?.merged,
            'tray-glass__layer--join-below': joinsBelow(index),
            'tray-glass__layer--join-above': joinsAbove(index),
          },
        ]"
        :data-landing-key="landed(index) ? landing?.key : undefined"
        :data-color="color"
      >
        <component :is="marks[color]!.icon" class="tray-glass__mark" aria-hidden="true" />
      </span>
    </span>
  </button>
</template>

<style scoped>
.tray-glass {
  --layer-size: 2.25rem;
  display: block;
  box-sizing: content-box;
  /* 4px = the inner padding, which keeps the blobs off the glass wall. */
  width: calc(var(--layer-size) + 0.5rem);
  min-width: var(--button-min-size);
  height: calc(var(--layer-size) * var(--capacity) + 0.5rem);
  padding: 0;
  background-color: color-mix(in srgb, var(--surface-color) 70%, transparent);
  border: 3px solid var(--text-color);
  border-top: none;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  cursor: pointer;
}

.tray-glass:focus-visible {
  outline: 3px solid var(--focus-ring-color);
  outline-offset: 3px;
}

.tray-glass:disabled {
  cursor: default;
}

.tray-glass__inner {
  display: flex;
  flex-direction: column-reverse;
  align-items: stretch;
  height: 100%;
  padding: 0.25rem;
  box-sizing: border-box;
}

.tray-glass__layer {
  display: flex;
  flex: 0 0 var(--layer-size);
  align-items: center;
  justify-content: center;
  height: var(--layer-size);
  border-radius: 45%;
}

.tray-glass__mark {
  width: 50%;
  height: 50%;
  stroke-width: 2;
  opacity: var(--jelly-mark-opacity);
}

.tray-glass__layer--join-below {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.tray-glass__layer--join-above {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

/* The lifted, outlined block. Both cues are static, so they work without motion. */
.tray-glass__layer--lifted {
  transform: translateY(-0.75rem);
  outline: 3px solid var(--text-color);
  outline-offset: 1px;
}

/* Motion. Only the selected block wobbles and only a landed block flows, all of it is
   off with reduced motion (the script sets no classes then, this is the second guard). */
.tray-glass__layer--wobble {
  animation: jelly-wobble 700ms ease-in-out infinite;
}

.tray-glass__layer--flow {
  animation: jelly-flow 320ms ease-out both;
}

/* The landed blob starts soft and settles into the joined shape of the layer below. */
.tray-glass__layer--merge {
  animation:
    jelly-flow 320ms ease-out both,
    jelly-merge 450ms ease-out both;
}

@keyframes jelly-wobble {
  0%,
  100% {
    transform: translateY(-0.75rem) rotate(-2deg) scale(1.02, 0.98);
    border-radius: 45%;
  }
  50% {
    transform: translateY(-0.85rem) rotate(2deg) scale(0.98, 1.03);
    border-radius: 40% 50% 45% 50%;
  }
}

@keyframes jelly-flow {
  from {
    transform: translate(var(--flow-x, 0), var(--flow-y, 0));
  }
  to {
    transform: none;
  }
}

@keyframes jelly-merge {
  from {
    border-radius: 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tray-glass__layer--wobble,
  .tray-glass__layer--flow,
  .tray-glass__layer--merge {
    animation: none;
  }
}
</style>
