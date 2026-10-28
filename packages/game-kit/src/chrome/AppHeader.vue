<script setup lang="ts">
/**
 * Sticky page header with the slots `left`, `center` and `right`.
 * The slot containers have the ids `chrome-header-left`, `chrome-header-center`
 * and `chrome-header-right`, so `ChromeSlot` can teleport content into them.
 * The inner row uses the layout class `content-column` (width rule: max 960px
 * centered, 98% on narrow screens).
 */
</script>

<template>
  <header class="app-header">
    <div class="content-column app-header-row">
      <div id="chrome-header-left" class="app-header-slot app-header-left">
        <slot name="left" />
      </div>
      <div id="chrome-header-center" class="app-header-slot app-header-center">
        <slot name="center" />
      </div>
      <div id="chrome-header-right" class="app-header-slot app-header-right">
        <slot name="right" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--chrome-surface-color);
  color: var(--on-chrome-color);
  border-block-end: 3px solid var(--chrome-accent-color);
}

.app-header-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--spacing-sm);
  min-height: var(--button-min-size);
}

.app-header-slot {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

.app-header-center {
  justify-content: center;
}

.app-header-right {
  justify-content: flex-end;
}
.app-header :deep(a:not(.app-button)),
.app-header :deep(button:not(.app-button)) {
  color: var(--on-chrome-color);
  border-radius: var(--radius);
}

.app-header :deep(button:not(.app-button)) {
  background: transparent;
  border: 0;
  cursor: pointer;
}

.app-header :deep(a:not(.app-button):hover),
.app-header :deep(button:not(.app-button):hover) {
  color: var(--chrome-accent-color);
}

.app-header :deep(a:focus-visible),
.app-header :deep(button:focus-visible) {
  outline: 2px solid var(--chrome-focus-ring-color);
  outline-offset: 2px;
}
</style>
