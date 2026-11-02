<script setup lang="ts">
import { ref, watch } from 'vue';
import AppButton from '../buttons/AppButton.vue';
import AppDialog from '../dialog/AppDialog.vue';

const props = defineProps<{ open: boolean; heading: string; resumeLabel: string }>();
const emit = defineEmits<{ resume: [] }>();
const dialog = ref<{ open(): Promise<void>; close(): void } | null>(null);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      void dialog.value?.open();
    } else {
      dialog.value?.close();
    }
  },
  { immediate: true, flush: 'post' },
);
</script>

<template>
  <AppDialog ref="dialog" :heading="heading" backdrop="opaque" @close="emit('resume')">
    <slot />
    <template #actions>
      <AppButton variant="primary" @click="emit('resume')">{{ resumeLabel }}</AppButton>
    </template>
  </AppDialog>
</template>
