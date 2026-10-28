<script setup lang="ts">
/**
 * Sticky page footer with the slots `left`, `center` and `right`.
 * The slot containers have the ids `chrome-footer-left`, `chrome-footer-center`
 * and `chrome-footer-right`, so `ChromeSlot` can teleport content into them.
 * The inner row uses the layout class `content-column` (width rule: max 960px
 * centered, 98% on narrow screens).
 */
</script>

<template>
  <footer class="app-footer">
    <div class="content-column app-footer-row">
      <div id="chrome-footer-left" class="app-footer-slot app-footer-left">
        <slot name="left" />
      </div>
      <div id="chrome-footer-center" class="app-footer-slot app-footer-center">
        <slot name="center" />
      </div>
      <div id="chrome-footer-right" class="app-footer-slot app-footer-right">
        <slot name="right" />
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  background: var(--chrome-surface-color);
  color: var(--on-chrome-color);
  border-block-start: 3px solid var(--chrome-accent-color);
}

.app-footer-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--spacing-sm);
  min-height: var(--button-min-size);
}

.app-footer-slot {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

.app-footer-center {
  justify-content: center;
}

.app-footer-right {
  justify-content: flex-end;
}
.app-footer :deep(a:not(.app-button)),
.app-footer :deep(button:not(.app-button)) {
  color: var(--on-chrome-color);
  border-radius: var(--radius);
}

.app-footer :deep(button:not(.app-button)) {
  background: transparent;
  border: 0;
  cursor: pointer;
}

.app-footer :deep(a:not(.app-button):hover),
.app-footer :deep(button:not(.app-button):hover) {
  color: var(--chrome-accent-color);
}

.app-footer :deep(a:focus-visible),
.app-footer :deep(button:focus-visible) {
  outline: 2px solid var(--chrome-focus-ring-color);
  outline-offset: 2px;
}
</style>
