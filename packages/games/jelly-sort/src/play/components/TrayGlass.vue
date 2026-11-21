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

// Index where the selected top block starts, -1 when nothing is selected. The block is
// rendered as one wrapper so it lifts, outlines and wobbles as a single unit.
const blockStart = computed(() => (props.selected ? topBlockStart(props.layers) : -1));

const belowBlock = computed(() => (blockStart.value < 0 ? props.layers.length : blockStart.value));

// One layer, two layers, three or more: each gets its own wobble kind.
const wobbleKind = computed(() => Math.min(Math.max(props.layers.length - blockStart.value, 1), 3));

// Read when the selection changes, so a changed preference applies to the next selection.
const wobbling = computed(() => props.selected && !prefersReducedMotion());

const blockIndexes = computed(() => {
  const indexes: number[] = [];
  for (let i = blockStart.value; i >= 0 && i < props.layers.length; i++) {
    indexes.push(i);
  }
  return indexes;
});

function layerClasses(index: number): unknown[] {
  return [
    'tray-glass__layer',
    `jelly--${props.layers[index]}`,
    {
      'tray-glass__layer--flow': landed(index),
      'tray-glass__layer--merge': landed(index) && props.landing?.merged,
      'tray-glass__layer--join-below': joinsBelow(index),
      'tray-glass__layer--join-above': joinsAbove(index),
    },
  ];
}

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
      <template v-for="(color, index) in layers" :key="index">
        <span
          v-if="index < belowBlock"
          :class="layerClasses(index)"
          :data-landing-key="landed(index) ? landing?.key : undefined"
          :data-color="color"
        >
          <component :is="marks[color]!.icon" class="tray-glass__mark" aria-hidden="true" />
        </span>
      </template>
      <span
        v-if="blockStart >= 0"
        :class="[
          'tray-glass__block',
          'tray-glass__block--lifted',
          { [`tray-glass__block--wobble tray-glass__block--wobble-${wobbleKind}`]: wobbling },
        ]"
        :data-wobble="wobbling ? wobbleKind : undefined"
      >
        <template v-for="index in blockIndexes" :key="index">
          <span
            :class="layerClasses(index)"
            :data-landing-key="landed(index) ? landing?.key : undefined"
            :data-color="layers[index]"
          >
            <component
              :is="marks[layers[index]!]!.icon"
              class="tray-glass__mark"
              aria-hidden="true"
            />
          </span>
        </template>
      </span>
    </span>
  </button>
</template>

<style scoped>
.tray-glass {
  --layer-size: 2.25rem;
  /* Glass wall thickness. The tray width constant in tray-columns.ts depends on it. */
  --glass-wall: 5px;
  display: block;
  box-sizing: content-box;
  /* 4px each side = the inner padding: a little air between layer and glass wall. */
  width: calc(var(--layer-size) + 0.5rem);
  min-width: var(--button-min-size);
  height: calc(var(--layer-size) * var(--capacity) + 0.5rem);
  padding: 0;
  background-color: color-mix(in srgb, var(--surface-color) 70%, transparent);
  border: var(--glass-wall) solid var(--text-color);
  border-top: none;
  border-radius: 0 0 var(--radius) var(--radius);
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

/* A selected tray clips at the glass walls (not at the top, so the lifted block stays visible),
   so a wobbling block can never be seen outside the glass. */
.tray-glass--selected .tray-glass__inner {
  clip-path: inset(-100vmax 0 0 0);
}

.tray-glass__layer {
  display: flex;
  flex: 0 0 var(--layer-size);
  align-items: center;
  justify-content: center;
  height: var(--layer-size);
  border-radius: var(--jelly-radius);
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

/* The selected top block: one unit with a lift and an outline around the whole stack.
   Both cues are static, so they work without motion. */
.tray-glass__block {
  /* Tune the wobble here. The jelly deforms in place, it never rotates or travels sideways.
     pinch: how far the waist pulls in (fraction of the width, a polygon clip).
     bulge: how far the walls push out when squashed (fraction of the width as scaleX).
     squash: vertical squash and stretch (fraction of the height).
     Air between layer and glass wall is 0.25rem, about 0.22 of a layer, so the bulge
     must stay well below that; the glass also clips a selected tray at its walls. */
  --wobble-pinch: 0.14;
  --wobble-bulge: 0.12;
  --wobble-squash: 0.1;
  --wobble-lift: 0.5rem;
  --wobble-duration: 600ms;
  --wobble-ring: 3px;
  --block-lift: -0.75rem;
  position: relative;
  display: flex;
  flex: none;
  flex-direction: column-reverse;
  transform: translateY(var(--block-lift));
  transform-origin: 50% 100%;
  outline: 3px solid var(--text-color);
  outline-offset: 1px;
  border-radius: var(--jelly-radius);
}

/* While wobbling, the shape is cut by an animated clip-path, which would cut a plain outline.
   So the outline is drawn as a ring (::after) that follows the same shape. The ring is part of
   the cut shape, so the outline is always visible. */
.tray-glass__block--wobble {
  overflow: hidden;
  outline: none;
}

.tray-glass__block--wobble::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--jelly-radius);
  background-color: var(--text-color);
  pointer-events: none;
}

/* Kind 1: a quick, springy squash with bulging walls, then a stretch with a pinched waist
   and a hop. Strong vertical squash and stretch. */
.tray-glass__block--wobble-1 {
  --wobble-pinch: 0.16;
  --wobble-bulge: 0.14;
  --wobble-squash: 0.16;
  --wobble-lift: 0.6rem;
  --wobble-duration: 450ms;
  animation: jelly-wobble-1 var(--wobble-duration) ease-in-out infinite;
}
.tray-glass__block--wobble-1::after {
  animation: jelly-ring-1 var(--wobble-duration) ease-in-out infinite;
}

/* Kind 2: a slower left-right bend, one wall pushes out while the other pulls in. */
.tray-glass__block--wobble-2 {
  --wobble-pinch: 0.16;
  --wobble-bulge: 0.12;
  --wobble-squash: 0.06;
  --wobble-lift: 0.45rem;
  --wobble-duration: 900ms;
  animation: jelly-wobble-2 var(--wobble-duration) ease-in-out infinite;
}
.tray-glass__block--wobble-2::after {
  animation: jelly-ring-2 var(--wobble-duration) ease-in-out infinite;
}

/* Kind 3: a heavy, slow jiggle of the walls with a fading aftershock. */
.tray-glass__block--wobble-3 {
  --wobble-pinch: 0.18;
  --wobble-bulge: 0.16;
  --wobble-squash: 0.12;
  --wobble-lift: 0.4rem;
  --wobble-duration: 1300ms;
  animation: jelly-wobble-3 var(--wobble-duration) ease-in-out infinite;
}
.tray-glass__block--wobble-3::after {
  animation: jelly-ring-3 var(--wobble-duration) ease-in-out infinite;
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

@keyframes jelly-wobble-1 {
  0%,
  100% {
    transform: translateY(calc(var(--block-lift) - 0rem))
      scale(calc(1 + var(--wobble-bulge)), calc(1 - var(--wobble-squash)));
    clip-path: polygon(
      calc(var(--wobble-bulge) * 100%) 0%,
      calc(100% - calc(var(--wobble-bulge) * 100%)) 0%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%)) 25%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%)) 50%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%)) 75%,
      calc(100% - calc(var(--wobble-bulge) * 100%)) 100%,
      calc(var(--wobble-bulge) * 100%) 100%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) 75%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%) 50%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) 25%
    );
  }
  45% {
    transform: translateY(calc(var(--block-lift) - var(--wobble-lift)))
      scale(1, calc(1 + var(--wobble-squash)));
    clip-path: polygon(
      calc(0 * 100%) 0%,
      calc(100% - calc(0 * 100%)) 0%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%)) 25%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%)) 50%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%)) 75%,
      calc(100% - calc(0 * 100%)) 100%,
      calc(0 * 100%) 100%,
      calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) 75%,
      calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%) 50%,
      calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) 25%
    );
  }
}
@keyframes jelly-ring-1 {
  0%,
  100% {
    clip-path: polygon(
      evenodd,
      calc(var(--wobble-bulge) * 100%) 0%,
      calc(100% - calc(var(--wobble-bulge) * 100%)) 0%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%)) 25%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%)) 50%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%)) 75%,
      calc(100% - calc(var(--wobble-bulge) * 100%)) 100%,
      calc(var(--wobble-bulge) * 100%) 100%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) 75%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%) 50%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) 25%,
      calc(var(--wobble-bulge) * 100%) 0%,
      calc(calc(var(--wobble-bulge) * 100%) + var(--wobble-ring)) var(--wobble-ring),
      calc(100% - calc(var(--wobble-bulge) * 100%) - var(--wobble-ring)) var(--wobble-ring),
      calc(
          100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) -
            var(--wobble-ring)
        )
        25%,
      calc(
          100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%) -
            var(--wobble-ring)
        )
        50%,
      calc(
          100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) -
            var(--wobble-ring)
        )
        75%,
      calc(100% - calc(var(--wobble-bulge) * 100%) - var(--wobble-ring))
        calc(100% - var(--wobble-ring)),
      calc(calc(var(--wobble-bulge) * 100%) + var(--wobble-ring)) calc(100% - var(--wobble-ring)),
      calc(
          calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) + var(--wobble-ring)
        )
        75%,
      calc(calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%) + var(--wobble-ring))
        50%,
      calc(
          calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) + var(--wobble-ring)
        )
        25%,
      calc(calc(var(--wobble-bulge) * 100%) + var(--wobble-ring)) var(--wobble-ring)
    );
  }
  45% {
    clip-path: polygon(
      evenodd,
      calc(0 * 100%) 0%,
      calc(100% - calc(0 * 100%)) 0%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%)) 25%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%)) 50%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%)) 75%,
      calc(100% - calc(0 * 100%)) 100%,
      calc(0 * 100%) 100%,
      calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) 75%,
      calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%) 50%,
      calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) 25%,
      calc(0 * 100%) 0%,
      calc(calc(0 * 100%) + var(--wobble-ring)) var(--wobble-ring),
      calc(100% - calc(0 * 100%) - var(--wobble-ring)) var(--wobble-ring),
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) - var(--wobble-ring)) 25%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%) - var(--wobble-ring)) 50%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) - var(--wobble-ring)) 75%,
      calc(100% - calc(0 * 100%) - var(--wobble-ring)) calc(100% - var(--wobble-ring)),
      calc(calc(0 * 100%) + var(--wobble-ring)) calc(100% - var(--wobble-ring)),
      calc(calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) + var(--wobble-ring)) 75%,
      calc(calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%) + var(--wobble-ring)) 50%,
      calc(calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) + var(--wobble-ring)) 25%,
      calc(calc(0 * 100%) + var(--wobble-ring)) var(--wobble-ring)
    );
  }
}
@keyframes jelly-wobble-2 {
  0%,
  100% {
    transform: translateY(calc(var(--block-lift) - 0rem))
      scale(calc(1 + var(--wobble-bulge) * 0.5), calc(1 - var(--wobble-squash) * 0.5));
    clip-path: polygon(
      calc(var(--wobble-bulge) * 100%) 0%,
      calc(100% - calc(0 * 100%)) 0%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%)) 25%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%)) 50%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%)) 75%,
      calc(100% - calc(0 * 100%)) 100%,
      calc(var(--wobble-bulge) * 100%) 100%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) 75%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%) 50%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) 25%
    );
  }
  25%,
  75% {
    transform: translateY(calc(var(--block-lift) - var(--wobble-lift)))
      scale(1, calc(1 + var(--wobble-squash)));
    clip-path: polygon(
      calc(0 * 100%) 0%,
      calc(100% - calc(0 * 100%)) 0%,
      calc(100% - calc((0 + (0 - 0) * 0.65) * 100%)) 25%,
      calc(100% - calc((0 + (0 - 0) * 1) * 100%)) 50%,
      calc(100% - calc((0 + (0 - 0) * 0.65) * 100%)) 75%,
      calc(100% - calc(0 * 100%)) 100%,
      calc(0 * 100%) 100%,
      calc((0 + (0 - 0) * 0.65) * 100%) 75%,
      calc((0 + (0 - 0) * 1) * 100%) 50%,
      calc((0 + (0 - 0) * 0.65) * 100%) 25%
    );
  }
  50% {
    transform: translateY(calc(var(--block-lift) - 0rem))
      scale(calc(1 + var(--wobble-bulge) * 0.5), calc(1 - var(--wobble-squash) * 0.5));
    clip-path: polygon(
      calc(0 * 100%) 0%,
      calc(100% - calc(var(--wobble-bulge) * 100%)) 0%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%)) 25%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%)) 50%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%)) 75%,
      calc(100% - calc(var(--wobble-bulge) * 100%)) 100%,
      calc(0 * 100%) 100%,
      calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) 75%,
      calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%) 50%,
      calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) 25%
    );
  }
}
@keyframes jelly-ring-2 {
  0%,
  100% {
    clip-path: polygon(
      evenodd,
      calc(var(--wobble-bulge) * 100%) 0%,
      calc(100% - calc(0 * 100%)) 0%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%)) 25%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%)) 50%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%)) 75%,
      calc(100% - calc(0 * 100%)) 100%,
      calc(var(--wobble-bulge) * 100%) 100%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) 75%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%) 50%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) 25%,
      calc(var(--wobble-bulge) * 100%) 0%,
      calc(calc(var(--wobble-bulge) * 100%) + var(--wobble-ring)) var(--wobble-ring),
      calc(100% - calc(0 * 100%) - var(--wobble-ring)) var(--wobble-ring),
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) - var(--wobble-ring)) 25%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%) - var(--wobble-ring)) 50%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) - var(--wobble-ring)) 75%,
      calc(100% - calc(0 * 100%) - var(--wobble-ring)) calc(100% - var(--wobble-ring)),
      calc(calc(var(--wobble-bulge) * 100%) + var(--wobble-ring)) calc(100% - var(--wobble-ring)),
      calc(
          calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) + var(--wobble-ring)
        )
        75%,
      calc(calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%) + var(--wobble-ring))
        50%,
      calc(
          calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) + var(--wobble-ring)
        )
        25%,
      calc(calc(var(--wobble-bulge) * 100%) + var(--wobble-ring)) var(--wobble-ring)
    );
  }
  25%,
  75% {
    clip-path: polygon(
      evenodd,
      calc(0 * 100%) 0%,
      calc(100% - calc(0 * 100%)) 0%,
      calc(100% - calc((0 + (0 - 0) * 0.65) * 100%)) 25%,
      calc(100% - calc((0 + (0 - 0) * 1) * 100%)) 50%,
      calc(100% - calc((0 + (0 - 0) * 0.65) * 100%)) 75%,
      calc(100% - calc(0 * 100%)) 100%,
      calc(0 * 100%) 100%,
      calc((0 + (0 - 0) * 0.65) * 100%) 75%,
      calc((0 + (0 - 0) * 1) * 100%) 50%,
      calc((0 + (0 - 0) * 0.65) * 100%) 25%,
      calc(0 * 100%) 0%,
      calc(calc(0 * 100%) + var(--wobble-ring)) var(--wobble-ring),
      calc(100% - calc(0 * 100%) - var(--wobble-ring)) var(--wobble-ring),
      calc(100% - calc((0 + (0 - 0) * 0.65) * 100%) - var(--wobble-ring)) 25%,
      calc(100% - calc((0 + (0 - 0) * 1) * 100%) - var(--wobble-ring)) 50%,
      calc(100% - calc((0 + (0 - 0) * 0.65) * 100%) - var(--wobble-ring)) 75%,
      calc(100% - calc(0 * 100%) - var(--wobble-ring)) calc(100% - var(--wobble-ring)),
      calc(calc(0 * 100%) + var(--wobble-ring)) calc(100% - var(--wobble-ring)),
      calc(calc((0 + (0 - 0) * 0.65) * 100%) + var(--wobble-ring)) 75%,
      calc(calc((0 + (0 - 0) * 1) * 100%) + var(--wobble-ring)) 50%,
      calc(calc((0 + (0 - 0) * 0.65) * 100%) + var(--wobble-ring)) 25%,
      calc(calc(0 * 100%) + var(--wobble-ring)) var(--wobble-ring)
    );
  }
  50% {
    clip-path: polygon(
      evenodd,
      calc(0 * 100%) 0%,
      calc(100% - calc(var(--wobble-bulge) * 100%)) 0%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%)) 25%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%)) 50%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%)) 75%,
      calc(100% - calc(var(--wobble-bulge) * 100%)) 100%,
      calc(0 * 100%) 100%,
      calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) 75%,
      calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%) 50%,
      calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) 25%,
      calc(0 * 100%) 0%,
      calc(calc(0 * 100%) + var(--wobble-ring)) var(--wobble-ring),
      calc(100% - calc(var(--wobble-bulge) * 100%) - var(--wobble-ring)) var(--wobble-ring),
      calc(
          100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) -
            var(--wobble-ring)
        )
        25%,
      calc(
          100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%) -
            var(--wobble-ring)
        )
        50%,
      calc(
          100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) -
            var(--wobble-ring)
        )
        75%,
      calc(100% - calc(var(--wobble-bulge) * 100%) - var(--wobble-ring))
        calc(100% - var(--wobble-ring)),
      calc(calc(0 * 100%) + var(--wobble-ring)) calc(100% - var(--wobble-ring)),
      calc(calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) + var(--wobble-ring)) 75%,
      calc(calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%) + var(--wobble-ring)) 50%,
      calc(calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) + var(--wobble-ring)) 25%,
      calc(calc(0 * 100%) + var(--wobble-ring)) var(--wobble-ring)
    );
  }
}
@keyframes jelly-wobble-3 {
  0%,
  100% {
    transform: translateY(calc(var(--block-lift) - 0rem))
      scale(calc(1 + var(--wobble-bulge)), calc(1 - var(--wobble-squash)));
    clip-path: polygon(
      calc(var(--wobble-bulge) * 100%) 0%,
      calc(100% - calc(var(--wobble-bulge) * 100%)) 0%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%)) 25%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%)) 50%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%)) 75%,
      calc(100% - calc(var(--wobble-bulge) * 100%)) 100%,
      calc(var(--wobble-bulge) * 100%) 100%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) 75%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%) 50%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) 25%
    );
  }
  25% {
    transform: translateY(calc(var(--block-lift) - var(--wobble-lift)))
      scale(1, calc(1 + var(--wobble-squash)));
    clip-path: polygon(
      calc(0 * 100%) 0%,
      calc(100% - calc(0 * 100%)) 0%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%)) 25%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%)) 50%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%)) 75%,
      calc(100% - calc(0 * 100%)) 100%,
      calc(0 * 100%) 100%,
      calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) 75%,
      calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%) 50%,
      calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) 25%
    );
  }
  50% {
    transform: translateY(calc(var(--block-lift) - 0rem))
      scale(calc(1 + calc(var(--wobble-bulge) * 0.6)), calc(1 - calc(var(--wobble-squash) * 0.6)));
    clip-path: polygon(
      calc(calc(var(--wobble-bulge) * 0.6) * 100%) 0%,
      calc(100% - calc(calc(var(--wobble-bulge) * 0.6) * 100%)) 0%,
      calc(
          100% -
            calc(
              (calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 0.65) *
                100%
            )
        )
        25%,
      calc(
          100% -
            calc(
              (calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 1) * 100%
            )
        )
        50%,
      calc(
          100% -
            calc(
              (calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 0.65) *
                100%
            )
        )
        75%,
      calc(100% - calc(calc(var(--wobble-bulge) * 0.6) * 100%)) 100%,
      calc(calc(var(--wobble-bulge) * 0.6) * 100%) 100%,
      calc((calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 0.65) * 100%)
        75%,
      calc((calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 1) * 100%) 50%,
      calc((calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 0.65) * 100%)
        25%
    );
  }
  75% {
    transform: translateY(calc(var(--block-lift) - calc(var(--wobble-lift) * 0.6)))
      scale(1, calc(1 + calc(var(--wobble-squash) * 0.6)));
    clip-path: polygon(
      calc(0 * 100%) 0%,
      calc(100% - calc(0 * 100%)) 0%,
      calc(100% - calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 0.65) * 100%)) 25%,
      calc(100% - calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 1) * 100%)) 50%,
      calc(100% - calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 0.65) * 100%)) 75%,
      calc(100% - calc(0 * 100%)) 100%,
      calc(0 * 100%) 100%,
      calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 0.65) * 100%) 75%,
      calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 1) * 100%) 50%,
      calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 0.65) * 100%) 25%
    );
  }
}
@keyframes jelly-ring-3 {
  0%,
  100% {
    clip-path: polygon(
      evenodd,
      calc(var(--wobble-bulge) * 100%) 0%,
      calc(100% - calc(var(--wobble-bulge) * 100%)) 0%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%)) 25%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%)) 50%,
      calc(100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%)) 75%,
      calc(100% - calc(var(--wobble-bulge) * 100%)) 100%,
      calc(var(--wobble-bulge) * 100%) 100%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) 75%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%) 50%,
      calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) 25%,
      calc(var(--wobble-bulge) * 100%) 0%,
      calc(calc(var(--wobble-bulge) * 100%) + var(--wobble-ring)) var(--wobble-ring),
      calc(100% - calc(var(--wobble-bulge) * 100%) - var(--wobble-ring)) var(--wobble-ring),
      calc(
          100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) -
            var(--wobble-ring)
        )
        25%,
      calc(
          100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%) -
            var(--wobble-ring)
        )
        50%,
      calc(
          100% - calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) -
            var(--wobble-ring)
        )
        75%,
      calc(100% - calc(var(--wobble-bulge) * 100%) - var(--wobble-ring))
        calc(100% - var(--wobble-ring)),
      calc(calc(var(--wobble-bulge) * 100%) + var(--wobble-ring)) calc(100% - var(--wobble-ring)),
      calc(
          calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) + var(--wobble-ring)
        )
        75%,
      calc(calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 1) * 100%) + var(--wobble-ring))
        50%,
      calc(
          calc((var(--wobble-bulge) + (0 - var(--wobble-bulge)) * 0.65) * 100%) + var(--wobble-ring)
        )
        25%,
      calc(calc(var(--wobble-bulge) * 100%) + var(--wobble-ring)) var(--wobble-ring)
    );
  }
  25% {
    clip-path: polygon(
      evenodd,
      calc(0 * 100%) 0%,
      calc(100% - calc(0 * 100%)) 0%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%)) 25%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%)) 50%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%)) 75%,
      calc(100% - calc(0 * 100%)) 100%,
      calc(0 * 100%) 100%,
      calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) 75%,
      calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%) 50%,
      calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) 25%,
      calc(0 * 100%) 0%,
      calc(calc(0 * 100%) + var(--wobble-ring)) var(--wobble-ring),
      calc(100% - calc(0 * 100%) - var(--wobble-ring)) var(--wobble-ring),
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) - var(--wobble-ring)) 25%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%) - var(--wobble-ring)) 50%,
      calc(100% - calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) - var(--wobble-ring)) 75%,
      calc(100% - calc(0 * 100%) - var(--wobble-ring)) calc(100% - var(--wobble-ring)),
      calc(calc(0 * 100%) + var(--wobble-ring)) calc(100% - var(--wobble-ring)),
      calc(calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) + var(--wobble-ring)) 75%,
      calc(calc((0 + (var(--wobble-pinch) - 0) * 1) * 100%) + var(--wobble-ring)) 50%,
      calc(calc((0 + (var(--wobble-pinch) - 0) * 0.65) * 100%) + var(--wobble-ring)) 25%,
      calc(calc(0 * 100%) + var(--wobble-ring)) var(--wobble-ring)
    );
  }
  50% {
    clip-path: polygon(
      evenodd,
      calc(calc(var(--wobble-bulge) * 0.6) * 100%) 0%,
      calc(100% - calc(calc(var(--wobble-bulge) * 0.6) * 100%)) 0%,
      calc(
          100% -
            calc(
              (calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 0.65) *
                100%
            )
        )
        25%,
      calc(
          100% -
            calc(
              (calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 1) * 100%
            )
        )
        50%,
      calc(
          100% -
            calc(
              (calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 0.65) *
                100%
            )
        )
        75%,
      calc(100% - calc(calc(var(--wobble-bulge) * 0.6) * 100%)) 100%,
      calc(calc(var(--wobble-bulge) * 0.6) * 100%) 100%,
      calc((calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 0.65) * 100%)
        75%,
      calc((calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 1) * 100%) 50%,
      calc((calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 0.65) * 100%)
        25%,
      calc(calc(var(--wobble-bulge) * 0.6) * 100%) 0%,
      calc(calc(calc(var(--wobble-bulge) * 0.6) * 100%) + var(--wobble-ring)) var(--wobble-ring),
      calc(100% - calc(calc(var(--wobble-bulge) * 0.6) * 100%) - var(--wobble-ring))
        var(--wobble-ring),
      calc(
          100% -
            calc(
              (calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 0.65) *
                100%
            ) -
            var(--wobble-ring)
        )
        25%,
      calc(
          100% -
            calc(
              (calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 1) * 100%
            ) -
            var(--wobble-ring)
        )
        50%,
      calc(
          100% -
            calc(
              (calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 0.65) *
                100%
            ) -
            var(--wobble-ring)
        )
        75%,
      calc(100% - calc(calc(var(--wobble-bulge) * 0.6) * 100%) - var(--wobble-ring))
        calc(100% - var(--wobble-ring)),
      calc(calc(calc(var(--wobble-bulge) * 0.6) * 100%) + var(--wobble-ring))
        calc(100% - var(--wobble-ring)),
      calc(
          calc(
              (calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 0.65) *
                100%
            ) +
            var(--wobble-ring)
        )
        75%,
      calc(
          calc(
              (calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 1) * 100%
            ) +
            var(--wobble-ring)
        )
        50%,
      calc(
          calc(
              (calc(var(--wobble-bulge) * 0.6) + (0 - calc(var(--wobble-bulge) * 0.6)) * 0.65) *
                100%
            ) +
            var(--wobble-ring)
        )
        25%,
      calc(calc(calc(var(--wobble-bulge) * 0.6) * 100%) + var(--wobble-ring)) var(--wobble-ring)
    );
  }
  75% {
    clip-path: polygon(
      evenodd,
      calc(0 * 100%) 0%,
      calc(100% - calc(0 * 100%)) 0%,
      calc(100% - calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 0.65) * 100%)) 25%,
      calc(100% - calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 1) * 100%)) 50%,
      calc(100% - calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 0.65) * 100%)) 75%,
      calc(100% - calc(0 * 100%)) 100%,
      calc(0 * 100%) 100%,
      calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 0.65) * 100%) 75%,
      calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 1) * 100%) 50%,
      calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 0.65) * 100%) 25%,
      calc(0 * 100%) 0%,
      calc(calc(0 * 100%) + var(--wobble-ring)) var(--wobble-ring),
      calc(100% - calc(0 * 100%) - var(--wobble-ring)) var(--wobble-ring),
      calc(
          100% - calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 0.65) * 100%) -
            var(--wobble-ring)
        )
        25%,
      calc(100% - calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 1) * 100%) - var(--wobble-ring))
        50%,
      calc(
          100% - calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 0.65) * 100%) -
            var(--wobble-ring)
        )
        75%,
      calc(100% - calc(0 * 100%) - var(--wobble-ring)) calc(100% - var(--wobble-ring)),
      calc(calc(0 * 100%) + var(--wobble-ring)) calc(100% - var(--wobble-ring)),
      calc(calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 0.65) * 100%) + var(--wobble-ring)) 75%,
      calc(calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 1) * 100%) + var(--wobble-ring)) 50%,
      calc(calc((0 + (calc(var(--wobble-pinch) * 0.6) - 0) * 0.65) * 100%) + var(--wobble-ring)) 25%,
      calc(calc(0 * 100%) + var(--wobble-ring)) var(--wobble-ring)
    );
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
  .tray-glass__block--wobble,
  .tray-glass__block--wobble::after,
  .tray-glass__layer--flow,
  .tray-glass__layer--merge {
    animation: none;
  }
}
</style>
