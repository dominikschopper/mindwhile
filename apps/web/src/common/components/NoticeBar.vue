<script setup lang="ts">
import { IconClose } from '@mindwhile/game-kit'
import { dismissNotice, notice } from '../composables/use-notice'
import { t } from '../texts'
</script>

<template>
  <div v-if="notice !== null" class="notice-bar" role="alert">
    <p class="notice-text">{{ notice }}</p>
    <button
      type="button"
      class="chrome-button"
      :aria-label="t('notice.dismiss')"
      @click="dismissNotice"
    >
      <IconClose aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.notice-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding-inline: var(--spacing-sm);
  background: var(--surface-raised-color);
  border-block-end: 1px solid var(--border-color);
  color: var(--text-color);
}

.notice-text {
  margin: 0;
}
</style>
