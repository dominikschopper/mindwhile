<script setup lang="ts">
import { AppButton, IconMenu } from '@mindwhile/game-kit'
import { RouterLink } from 'vue-router'
import { usePopover } from '../composables/use-popover'
import { t } from '../texts'

const { open, root, button, close, onKeydown } = usePopover()

// AppButton is a component: its template ref is the instance, the trigger is its root element.
function setButton(instance: unknown): void {
  const el = (instance as { $el?: unknown } | null)?.$el
  button.value = (el as typeof button.value | undefined) ?? null
}

// Keys pressed in the open menu must not reach handlers behind it (for example game shortcuts).
function onMenuKeydown(event: Parameters<typeof onKeydown>[0]): void {
  const wasOpen = open.value
  onKeydown(event)
  if (wasOpen) event.stopPropagation()
}
</script>

<template>
  <div ref="root" class="main-menu" @keydown="onMenuKeydown">
    <AppButton
      :ref="setButton"
      class="chrome-button"
      :aria-label="t('menu.button')"
      :aria-expanded="open"
      aria-controls="main-menu-list"
      @click="open = !open"
    >
      <IconMenu />
    </AppButton>
    <ul v-show="open" id="main-menu-list" class="main-menu-list">
      <li>
        <RouterLink to="/settings" @click="close">{{ t('menu.settings') }}</RouterLink>
      </li>
      <li>
        <AppButton disabled aria-describedby="main-menu-language-hint">
          {{ t('menu.language') }}
        </AppButton>
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
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-raised);
}
</style>
