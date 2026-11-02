<script setup lang="ts">
import AppButton from '../buttons/AppButton.vue';
import { IconPause } from '../icons';

defineProps<{ label: string }>();
</script>

<template>
  <AppButton variant="secondary">
    <template #icon><IconPause /></template>
    {{ label }}
  </AppButton>
</template>
