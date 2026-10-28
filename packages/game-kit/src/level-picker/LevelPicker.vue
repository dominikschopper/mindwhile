<script setup lang="ts">
import { computed, useId } from 'vue'

/**
 * Level selection as a native radio group. The DOM order is ascending (arrow
 * keys and screen readers follow the manifest order), the visual order is
 * reversed by CSS so the highest level stands on top.
 */
const props = defineProps<{
  modelValue: string
  levels: { id: string; label: string; best?: string }[]
  legend: string
}>()

const emit = defineEmits<{ 'update:modelValue': [level: string] }>()

const name = useId()

// Visual row from the top: the highest level stands on top, so ascending
// index `i` of `n` levels sits in row `n - 1 - i`.
const count = computed(() => props.levels.length)
const selectedRow = computed(() => {
  const index = props.levels.findIndex((level) => level.id === props.modelValue)
  return index < 0 ? 0 : count.value - 1 - index
})
</script>

<template>
  <fieldset class="level-picker">
    <legend class="visually-hidden">{{ legend }}</legend>
    <div
      class="level-picker-steps"
      :style="{ '--level-count': count, '--selected-row': selectedRow }"
    >
      <span class="level-picker-highlight" aria-hidden="true"></span>
      <div
        v-for="(level, index) in levels"
        :key="level.id"
        class="level-picker-item"
        :class="{ selected: level.id === modelValue }"
        :style="{ '--row': count - 1 - index }"
      >
        <input
          :id="`${name}-${level.id}`"
          type="radio"
          class="level-picker-input visually-hidden"
          :name="name"
          :value="level.id"
          :checked="level.id === modelValue"
          @change="emit('update:modelValue', level.id)"
        />
        <label class="level-picker-step" :for="`${name}-${level.id}`">
          <span class="level-picker-label">{{ level.label }}</span>
          <span v-if="level.best" class="level-picker-best">{{ level.best }}</span>
          <slot name="step" :level="level.id" :selected="level.id === modelValue" />
        </label>
      </div>
    </div>
  </fieldset>
</template>

<style scoped>
.level-picker {
  --level-step-height: 4.5rem;
  --level-gap: var(--spacing-md);
  --level-stair-shift: 0.75rem;
  --level-lift: 0.25rem;
  --level-face: 0.25rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.level-picker-steps {
  /* Declared here: --level-count is set on this element, a var() inside a custom property
     is resolved where the property is declared, not where it is used. */
  --level-width: calc(100% - (var(--level-count) - 1) * var(--level-stair-shift));
  position: relative;
  display: flex;
  flex-direction: column-reverse;
  gap: var(--level-gap);
  padding-top: var(--level-lift);
  padding-bottom: var(--level-face);
}

/* One slab that slides to the selected row; only transform is animated. */
.level-picker-highlight {
  position: absolute;
  top: var(--level-lift);
  left: 0;
  z-index: 0;
  width: var(--level-width);
  height: var(--level-step-height);
  border-radius: var(--radius);
  background: var(--game-color, var(--accent-color));
  box-shadow: 0 0.5rem 1rem -0.25rem color-mix(in srgb, var(--text-color) 35%, transparent);
  transform: translate(
    calc(var(--selected-row) * var(--level-stair-shift) + var(--level-lift)),
    calc(var(--selected-row) * (var(--level-step-height) + var(--level-gap)) - var(--level-lift))
  );
  transition: transform 200ms ease-out;
}

.level-picker-highlight::after {
  content: '';
  position: absolute;
  inset: 100% 0.25rem auto;
  height: var(--level-face);
  border-radius: 0 0 var(--radius) var(--radius);
  background: color-mix(in srgb, var(--game-color, var(--accent-color)) 70%, var(--text-color));
}

.level-picker-item {
  position: relative;
  z-index: 1;
  /* Margins instead of a percentage width: the row keeps the same total width at every row,
     also when a parent sizes the picker by its content (fit-content, max-content). */
  margin-left: calc(var(--row) * var(--level-stair-shift));
  margin-right: calc((var(--level-count) - 1 - var(--row)) * var(--level-stair-shift));
}

/* Side face of a resting slab. */
.level-picker-item::after {
  content: '';
  position: absolute;
  inset: 100% 0.25rem auto;
  height: var(--level-face);
  border-radius: 0 0 var(--radius) var(--radius);
  background: var(--border-color);
}

.level-picker-item.selected::after {
  display: none;
}

.level-picker-step {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  box-sizing: border-box;
  height: var(--level-step-height);
  min-height: var(--button-min-size);
  overflow: hidden;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--surface-raised-color);
  color: var(--text-color);
  cursor: pointer;
  transition: transform 200ms ease-out;
}

.level-picker-item.selected .level-picker-step {
  border-color: transparent;
  background: transparent;
  color: var(--on-game-color, var(--text-color));
  transform: translate(var(--level-lift), calc(-1 * var(--level-lift)));
}

.level-picker-input:focus-visible + .level-picker-step {
  outline: 3px solid var(--focus-ring-color);
  outline-offset: 2px;
}

.level-picker-label {
  font-weight: 600;
}

.level-picker-best {
  font-size: 0.875rem;
}

@media (prefers-reduced-motion: reduce) {
  .level-picker-highlight,
  .level-picker-step {
    transition: none;
  }
}
</style>
