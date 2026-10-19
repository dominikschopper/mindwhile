<script setup lang="ts">
import type { ChromeSlotName } from './types'

/**
 * Teleports its content into a slot container of the platform's header or
 * footer. The target is looked up lazily (`defer`), so the slot may be mounted
 * before or after the bar. Without a target nothing is rendered.
 */
defineProps<{ name: ChromeSlotName }>()
</script>

<template>
  <Teleport defer :to="'#chrome-' + name">
    <slot />
  </Teleport>
</template>
