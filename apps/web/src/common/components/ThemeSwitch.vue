<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '../composables/use-theme'
import { t } from '../texts'

const choiceKeys = {
  system: 'theme.choice.system',
  light: 'theme.choice.light',
  dark: 'theme.choice.dark',
} as const

const { choice, cycle } = useTheme()

const choiceText = computed(() => t(choiceKeys[choice.value]))
const label = computed(() => t('theme.label', { choice: choiceText.value }))
</script>

<template>
  <button type="button" :aria-label="label" @click="cycle">{{ choiceText }}</button>
</template>
