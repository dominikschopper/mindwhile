<script setup lang="ts">
import { nextTick, ref, useId } from 'vue'
import { t } from './texts'

const emit = defineEmits<{ confirm: []; cancel: [] }>()
const dialog = ref<{ showModal(): void; close(): void } | null>(null)
const headingId = useId()

async function open(): Promise<void> {
  await nextTick()
  dialog.value?.showModal()
}

function keepPlaying(): void {
  dialog.value?.close()
  emit('cancel')
}

function confirmAbort(): void {
  dialog.value?.close()
  emit('confirm')
}

defineExpose({ open })
</script>

<template>
  <dialog
    ref="dialog"
    class="abort-dialog"
    :aria-labelledby="headingId"
    @keydown.esc.prevent="keepPlaying"
    @keydown.stop
    @cancel.prevent="keepPlaying"
  >
    <h2 :id="headingId">{{ t('abort.heading') }}</h2>
    <p>{{ t('abort.text') }}</p>
    <div class="play-actions">
      <button type="button" class="abort-confirm" @click="confirmAbort">
        {{ t('abort.confirm') }}
      </button>
      <button type="button" class="abort-cancel" @click="keepPlaying">
        {{ t('abort.cancel') }}
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.play-actions {
  display: flex;
  gap: var(--spacing-sm);
}
</style>
