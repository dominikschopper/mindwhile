<script setup lang="ts">
import { useId } from 'vue'
import { IconCheck } from '../icons'

/**
 * Level selection as a native radio group of cards. The DOM order is ascending
 * (arrow keys and screen readers follow the manifest order); the whole card is
 * the label of its radio.
 */
defineProps<{
  modelValue: string
  levels: { id: string; label: string; best?: string }[]
  legend: string
  selectedLabel: string
}>()

const emit = defineEmits<{ 'update:modelValue': [level: string] }>()

const name = useId()
</script>

<template>
  <fieldset class="level-picker">
    <legend class="visually-hidden">{{ legend }}</legend>
    <div class="level-picker-cards">
      <div
        v-for="level in levels"
        :key="level.id"
        class="level-picker-item"
        :class="{ selected: level.id === modelValue }"
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
        <label class="level-picker-card" :for="`${name}-${level.id}`">
          <span class="level-picker-label">{{ level.label }}</span>
          <span v-if="level.id === modelValue" class="level-picker-mark">
            <IconCheck :size="16" />
            <span class="visually-hidden">{{ selectedLabel }}</span>
          </span>
          <span class="level-picker-preview">
            <slot name="step" :level="level.id" :selected="level.id === modelValue" />
          </span>
          <span v-if="level.best" class="level-picker-best">{{ level.best }}</span>
        </label>
      </div>
    </div>
  </fieldset>
</template>

<style scoped>
.level-picker {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.level-picker-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: var(--spacing-md);
}

.level-picker-item {
  position: relative;
  display: flex;
}

.level-picker-card {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'label mark'
    'preview preview'
    'best best';
  align-items: center;
  gap: var(--spacing-sm);
  box-sizing: border-box;
  width: 100%;
  min-height: var(--button-min-size);
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--surface-color);
  box-shadow: var(--shadow-card);
  color: var(--text-color);
  cursor: pointer;
  transition:
    box-shadow 150ms ease-out,
    border-color 150ms ease-out;
}

.level-picker-item.selected .level-picker-card {
  border-color: var(--game-color, var(--accent-color));
  box-shadow: var(--shadow-raised);
}

.level-picker-input:focus-visible + .level-picker-card {
  outline: 3px solid var(--focus-ring-color);
  outline-offset: 2px;
}

.level-picker-label {
  grid-area: label;
  font-weight: 600;
}

.level-picker-mark {
  grid-area: mark;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--radius-pill);
  background: var(--game-color, var(--accent-color));
  color: var(--on-game-color, var(--text-color));
}

.level-picker-preview {
  grid-area: preview;
  display: flex;
  justify-content: center;
}

.level-picker-best {
  grid-area: best;
  font-size: 0.875rem;
}

@media (max-width: 30rem) {
  .level-picker-cards {
    grid-template-columns: 1fr;
  }

  .level-picker-card {
    grid-template-columns: auto 1fr auto;
    grid-template-areas:
      'preview label mark'
      'preview best best';
    align-content: center;
    column-gap: var(--spacing-md);
  }

  .level-picker-preview {
    justify-content: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .level-picker-card {
    transition: none;
  }
}
</style>
