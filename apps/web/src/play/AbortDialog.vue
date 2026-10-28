<script setup lang="ts">
import { AppButton, AppDialog } from '@mindwhile/game-kit'
import { ref } from 'vue'
import { t } from './texts'

const emit = defineEmits<{ confirm: []; cancel: [] }>()
const dialog = ref<{ open(): Promise<void>; close(): void } | null>(null)

async function open(): Promise<void> {
  await dialog.value?.open()
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
  <AppDialog ref="dialog" :heading="t('abort.heading')" @close="emit('cancel')">
    <p>{{ t('abort.text') }}</p>
    <template #actions>
      <AppButton variant="danger" class="abort-confirm" @click="confirmAbort">
        {{ t('abort.confirm') }}
      </AppButton>
      <AppButton variant="secondary" class="abort-cancel" @click="keepPlaying">
        {{ t('abort.cancel') }}
      </AppButton>
    </template>
  </AppDialog>
</template>
