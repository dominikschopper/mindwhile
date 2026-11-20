<script setup lang="ts">
import { IconSunMoon } from '@mindwhile/game-kit';
import { computed, useId } from 'vue';
import { type ThemeChoice, useTheme } from '../composables/use-theme';
import { t } from '../texts';

const { choice, setTheme } = useTheme();
const legendId = useId();

const options: { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: t('colorScheme.system') },
  { value: 'light', label: t('colorScheme.light') },
  { value: 'dark', label: t('colorScheme.dark') },
];

const selected = computed({
  get: () => choice.value,
  set: (value: ThemeChoice) => setTheme(value),
});
</script>

<template>
  <div class="color-scheme-choice" role="radiogroup" :aria-labelledby="legendId">
    <span :id="legendId" class="color-scheme-legend">
      <IconSunMoon aria-hidden="true" />
      {{ t('colorScheme.legend') }}
    </span>
    <label v-for="option in options" :key="option.value" class="color-scheme-option">
      <input v-model="selected" type="radio" name="color-scheme" :value="option.value" />
      {{ option.label }}
    </label>
  </div>
</template>

<style scoped>
.color-scheme-choice {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
}

.color-scheme-legend {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0;
}

.color-scheme-legend svg {
  inline-size: 1.25em;
  block-size: 1.25em;
}

.color-scheme-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-block-size: 44px;
}
</style>
