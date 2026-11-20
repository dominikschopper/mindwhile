<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import type { ProfileData } from '@mindwhile/core';
import { AppButton, AppDialog, IconSymbolPlaceholder, profileSymbols } from '@mindwhile/game-kit';
import { t } from './texts';

const props = defineProps<{ data: ProfileData; skipped: number }>();
const emit = defineEmits<{ merge: []; cancel: [] }>();
const dialog = useTemplateRef<{ open(): Promise<void>; close(): void }>('dialog');

// Own keys only: a symbol name from a file must not reach the prototype.
const symbol = computed(() =>
  Object.hasOwn(profileSymbols, props.data.profile.gamerSymbol)
    ? profileSymbols[props.data.profile.gamerSymbol as keyof typeof profileSymbols]
    : IconSymbolPlaceholder,
);

defineExpose({
  open: () => dialog.value?.open(),
  close: () => dialog.value?.close(),
});
</script>

<template>
  <AppDialog ref="dialog" :heading="t('dialog.heading')" @close="emit('cancel')">
    <p class="import-profile">
      <component :is="symbol" class="import-symbol" aria-hidden="true" />
      <span class="import-tag" :title="t('dialog.tag')">{{ data.profile.gamerTag }}</span>
    </p>
    <p class="import-results">{{ t('dialog.results', { count: data.best.length }) }}</p>
    <p>{{ t('dialog.merge') }}</p>
    <p v-if="skipped > 0" class="import-skipped">{{ t('dialog.skipped', { count: skipped }) }}</p>
    <template #actions>
      <AppButton variant="primary" class="import-merge" @click="emit('merge')">
        {{ t('dialog.mergeButton') }}
      </AppButton>
      <AppButton class="import-cancel" @click="emit('cancel')">
        {{ t('dialog.cancelButton') }}
      </AppButton>
    </template>
  </AppDialog>
</template>

<style scoped>
.import-profile {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: bold;
}

.import-symbol {
  inline-size: 1.5em;
  block-size: 1.5em;
}

.import-tag {
  overflow-wrap: anywhere;
}

.import-merge,
.import-cancel {
  min-block-size: 44px;
}
</style>
