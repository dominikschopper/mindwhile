<script setup lang="ts">
import { computed } from 'vue'
import { type ThemeChoice, useTheme } from '../common/composables/use-theme'
import { t } from './texts'

const { choice, setTheme } = useTheme()

const options: { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: t('colorScheme.system') },
  { value: 'light', label: t('colorScheme.light') },
  { value: 'dark', label: t('colorScheme.dark') },
]

const selected = computed({
  get: () => choice.value,
  set: (value: ThemeChoice) => setTheme(value),
})
</script>

<template>
  <h1>{{ t('page.title') }}</h1>
  <fieldset class="color-scheme">
    <legend>{{ t('colorScheme.legend') }}</legend>
    <label v-for="option in options" :key="option.value" class="color-scheme-option">
      <input v-model="selected" type="radio" name="color-scheme" :value="option.value" />
      {{ option.label }}
    </label>
  </fieldset>
</template>

<style scoped>
.color-scheme {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin: 0;
  padding: var(--spacing-md);
  border: 1px solid var(--border-color);
}

.color-scheme-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-block-size: 44px;
}
</style>
