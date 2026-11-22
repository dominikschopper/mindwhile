<script setup lang="ts">
import { computed } from 'vue';
import '../../common/styles/tokens.css';
import '../../common/styles/jelly-colors.css';
import { marks } from '../../common/board/marks';
import { prefersReducedMotion, type Landing } from '../animation';
import { topBlockStart } from './tray-glass';
import { wobbleFor } from '../wobble';
import { installWobbleStyles } from '../wobble-style';

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

installWobbleStyles();

// Read when the selection changes, so a changed preference applies to the next selection.
const wobbling = computed(() => props.selected && !prefersReducedMotion());

/** A run of layers: single plain layers, the selected block, or one of the two hovering blocks. */
type Group = {
  type: 'plain' | 'selected' | 'hover-existing' | 'hover-poured';
  indexes: number[];
};

function range(from: number, to: number): number[] {
  const indexes: number[] = [];
  for (let i = from; i < to; i++) {
    indexes.push(i);
  }
  return indexes;
}

// Where the poured block starts, -1 when the landing did not go onto the same color.
const pouredStart = computed(() => {
  const landing = props.landing;
  if (!landing || !landing.merged || landing.moved >= props.layers.length) {
    return -1;
  }
  return props.layers.length - landing.moved;
});

// Both blocks hover as separate wrappers, unless a selection takes over the top block.
const hovering = computed(
  () => props.landing?.phase === 'hover' && pouredStart.value > 0 && !props.selected,
);

// Start of the existing top block of the target (the run of equal colors below the poured one).
const existingStart = computed(() =>
  pouredStart.value > 0 ? topBlockStart(props.layers.slice(0, pouredStart.value)) : -1,
);

// Only the topmost layer of the target stack wobbles (and only its upper half deforms, see the
// anchored keyframes in ../wobble.ts). Every layer below stays a plain, still layer.
const existingWobbleStart = computed(() => pouredStart.value - 1);

const groups = computed<Group[]>(() => {
  const count = props.layers.length;
  const list: Group[] = [];
  let plainEnd = count;
  if (blockStart.value >= 0) {
    plainEnd = blockStart.value;
  } else if (hovering.value) {
    plainEnd = existingWobbleStart.value;
  }
  for (let i = 0; i < plainEnd; i++) {
    list.push({ type: 'plain', indexes: [i] });
  }
  if (blockStart.value >= 0) {
    list.push({ type: 'selected', indexes: range(blockStart.value, count) });
  } else if (hovering.value) {
    list.push({
      type: 'hover-existing',
      indexes: range(existingWobbleStart.value, pouredStart.value),
    });
    list.push({ type: 'hover-poured', indexes: range(pouredStart.value, count) });
  }
  return list;
});

function groupClasses(group: Group): unknown[] {
  const wobble = wobbleFor(group.indexes.length);
  const wobbles = group.type === 'selected' ? wobbling.value : true;
  return [
    'tray-glass__block',
    {
      'tray-glass__block--lifted': group.type === 'selected',
      'tray-glass__block--landing': group.type !== 'selected',
      'tray-glass__block--anchored': group.type !== 'selected',
      'tray-glass__block--hover-existing': group.type === 'hover-existing',
      'tray-glass__block--hover-poured': group.type === 'hover-poured',
      'tray-glass__block--wobble': wobbles,
      [`tray-glass__block--wobble-${wobble.kind}`]: wobbles,
      [`tray-glass__block--waves-${wobble.waves}`]: wobbles,
    },
  ];
}

function groupWobble(group: Group): number | undefined {
  const wobbles = group.type === 'selected' ? wobbling.value : true;
  return wobbles ? wobbleFor(group.indexes.length).kind : undefined;
}

function layerClasses(index: number): unknown[] {
  const landing = props.landing;
  const poured = landed(index);
  const settling =
    landing?.phase === 'merge' &&
    pouredStart.value > 0 &&
    index >= existingStart.value &&
    index < pouredStart.value;
  return [
    'tray-glass__layer',
    `jelly--${props.layers[index]}`,
    {
      'tray-glass__layer--flow': poured && landing?.phase === 'flow',
      'tray-glass__layer--merge': poured && landing?.phase === 'merge' && landing.merged,
      'tray-glass__layer--settle': settling,
      'tray-glass__layer--join-below': joinsBelow(index),
      'tray-glass__layer--join-above': joinsAbove(index),
    },
  ];
}

function landed(index: number): boolean {
  const landing = props.landing;
  return landing != null && index >= props.layers.length - landing.moved;
}

// Equal colors that touch fuse into one layer, so the touching corners are square. This holds
// while the two blocks hover too, so the seam shows neither a notch nor a gap.
function joinsBelow(index: number): boolean {
  return index > 0 && props.layers[index - 1] === props.layers[index];
}
function joinsAbove(index: number): boolean {
  return index < props.layers.length - 1 && props.layers[index + 1] === props.layers[index];
}

const flowStyle = computed(() =>
  props.landing
    ? {
        '--flow-x': `${props.landing.x}px`,
        '--flow-y': `${props.landing.y}px`,
        // A block that goes onto the same color ends its flow at the hover spot.
        '--flow-end': props.landing.merged ? 'var(--landing-lift)' : '0px',
      }
    : {},
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
    :data-landing-phase="landing?.phase"
    @click="emit('select')"
  >
    <span class="tray-glass__inner">
      <template v-for="group in groups" :key="`${group.type}-${group.indexes[0]}`">
        <span
          v-if="group.type === 'plain'"
          :class="layerClasses(group.indexes[0]!)"
          :data-landing-key="landed(group.indexes[0]!) ? landing?.key : undefined"
          :data-color="layers[group.indexes[0]!]"
        >
          <component
            :is="marks[layers[group.indexes[0]!]!]!.icon"
            class="tray-glass__mark"
            aria-hidden="true"
          />
        </span>
        <span v-else :class="groupClasses(group)" :data-wobble="groupWobble(group)">
          <template v-for="index in group.indexes" :key="index">
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
      </template>
    </span>
  </button>
</template>

<style scoped src="./TrayGlass.css"></style>
