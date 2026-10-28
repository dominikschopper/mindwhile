<script setup lang="ts">
import { nextTick, ref, useId } from 'vue'
import { activeElement, restoreFocus, type FocusTarget } from './focus'

withDefaults(defineProps<{ heading: string; backdrop?: 'rainbow' | 'opaque' }>(), {
  backdrop: 'rainbow',
})
const emit = defineEmits<{ close: [] }>()
const dialog = ref<{ showModal(): void; close(): void } | null>(null)
const headingId = useId()
let opener: FocusTarget = null

async function open(): Promise<void> {
  opener = activeElement()
  await nextTick()
  dialog.value?.showModal()
}

function close(): void {
  dialog.value?.close()
  restoreFocus(opener)
  opener = null
}

function dismiss(): void {
  close()
  emit('close')
}

defineExpose({ open, close })
</script>

<template>
  <dialog
    ref="dialog"
    class="app-dialog"
    :class="{ 'app-dialog-opaque': backdrop === 'opaque' }"
    :aria-labelledby="headingId"
    @keydown.esc.prevent="dismiss"
    @keydown.stop
    @cancel.prevent="dismiss"
  >
    <h2 :id="headingId">{{ heading }}</h2>
    <div class="app-dialog-content"><slot /></div>
    <div v-if="$slots.actions" class="app-dialog-actions"><slot name="actions" /></div>
  </dialog>
</template>

<style scoped>
.app-dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(32rem, calc(100% - 2 * var(--spacing-md)));
  max-height: calc(100% - 2 * var(--spacing-md));
  overflow: auto;
  padding: var(--spacing-lg);
  color: var(--text-color);
  background: var(--surface-raised-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
}

.app-dialog-content {
  margin-block: var(--spacing-md);
}

.app-dialog-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

/* Reduced motion (default): dark, semi-transparent */
.app-dialog::backdrop {
  background: rgb(0 0 0 / 0.6);
}

.app-dialog.app-dialog-opaque::backdrop {
  background: rgb(0 0 0);
  animation: none;
}

/* Rainbow: a hue shift on a gradient, runs about 8 seconds, then stops */
@media (prefers-reduced-motion: no-preference) {
  .app-dialog:not(.app-dialog-opaque)::backdrop {
    background: linear-gradient(
      135deg,
      hsl(0 85% 55% / 0.55),
      hsl(60 85% 55% / 0.55),
      hsl(120 85% 45% / 0.55),
      hsl(200 85% 55% / 0.55),
      hsl(280 85% 55% / 0.55)
    );
    animation: app-dialog-rainbow 4s linear 2;
  }
}

@keyframes app-dialog-rainbow {
  to {
    filter: hue-rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-dialog::backdrop {
    animation: none;
  }
}
</style>
