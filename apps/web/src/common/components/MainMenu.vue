<script setup lang="ts">
import { AppButton, IconMenu } from '@mindwhile/game-kit';
import BackupSection from '../backup/BackupSection.vue';
import { usePopover } from '../composables/use-popover';
import { t } from '../texts';
import ColorSchemeChoice from './ColorSchemeChoice.vue';

const { open, root, button, close, onKeydown } = usePopover();

// AppButton is a component: its template ref is the instance, the trigger is its root element.
function setButton(instance: unknown): void {
  const el = (instance as { $el?: unknown } | null)?.$el;
  button.value = (el as typeof button.value | undefined) ?? null;
}

// The import dialog opens later and returns focus to the element focused before it.
function onImportStarted(): void {
  close();
  button.value?.focus();
}

// Keys pressed in the open menu must not reach handlers behind it (for example game shortcuts).
function onMenuKeydown(event: Parameters<typeof onKeydown>[0]): void {
  const wasOpen = open.value;
  onKeydown(event);
  if (wasOpen) {
    event.stopPropagation();
  }
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
      <li><ColorSchemeChoice /></li>
      <li><BackupSection @import-started="onImportStarted" /></li>
      <li>
        <AppButton disabled>{{ t('menu.language') }}</AppButton>
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
  width: max-content;
  max-width: calc(100vw - 2 * var(--spacing-sm));
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  background: var(--surface-raised-color);
  /* The popover sits inside the header but on a raised surface: it must not inherit the header text color. */
  color: var(--text-color);
  /* Dark mode: a lighter border so the popover stands out from the dark page. */
  border: 1px solid
    light-dark(
      var(--border-color),
      color-mix(in srgb, var(--text-color) 40%, var(--surface-raised-color))
    );
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-raised);
}

/* A thin line between the menu items. */
.main-menu-list > li + li {
  padding-block-start: var(--spacing-sm);
  border-block-start: 1px solid var(--border-color);
}
</style>
