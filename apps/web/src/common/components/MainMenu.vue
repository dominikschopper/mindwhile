<script setup lang="ts">
import { IconMenu } from '@mindwhile/game-kit'
import { RouterLink } from 'vue-router'
import { usePopover } from '../composables/use-popover'
import { t } from '../texts'

const { open, root, button, close, onKeydown } = usePopover()
</script>

<template>
  <div ref="root" class="main-menu" @keydown="onKeydown">
    <button
      ref="button"
      type="button"
      class="chrome-button"
      :aria-label="t('menu.button')"
      :aria-expanded="open"
      aria-controls="main-menu-list"
      @click="open = !open"
    >
      <IconMenu />
    </button>
    <ul v-show="open" id="main-menu-list" class="main-menu-list">
      <li>
        <RouterLink to="/settings" @click="close">{{ t('menu.settings') }}</RouterLink>
      </li>
      <li>
        <button type="button" disabled aria-describedby="main-menu-language-hint">
          {{ t('menu.language') }}
        </button>
        <small id="main-menu-language-hint">{{ t('menu.languageHint') }}</small>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.main-menu {
  position: relative;
}

.main-menu-list {
  position: absolute;
  inset-block-start: 100%;
  inset-inline-end: 0;
  z-index: 20;
  margin: 0;
  padding: var(--spacing-sm);
  list-style: none;
  min-width: 14rem;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  background: var(--surface-raised-color);
  border: 1px solid var(--border-color);
}
</style>
