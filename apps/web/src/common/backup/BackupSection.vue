<script setup lang="ts">
import { ref, useId, useTemplateRef } from 'vue';
import type { ProfileData } from '@mindwhile/core';
import { AppButton, IconDownload, IconUpload } from '@mindwhile/game-kit';
import { roundState } from '../composables/use-chrome';
import { showToast } from '../composables/use-toasts';
import { useScoringOf } from '../composables/scoring-of';
import { useProfile } from '../profile/use-profile';
import ImportDialog from './ImportDialog.vue';
import { pickFile, saveProfileFile } from './file-io';
import {
  decodeProfileFile,
  encodeProfileFile,
  isBackupSupported,
  profileFileName,
} from './profile-file';
import { t } from './texts';

const emit = defineEmits<{ importStarted: [] }>();

const hintId = useId();
const supported = isBackupSupported();
const { profile, best, applyImport } = useProfile();
const scoringOf = useScoringOf();
const dialog = useTemplateRef<{ open(): void; close(): void }>('dialog');
const incoming = ref<{ data: ProfileData; skipped: number } | null>(null);

async function exportProfile(): Promise<void> {
  try {
    const blob = await encodeProfileFile({
      profile: { ...profile.value },
      best: best.value.map((entry) => ({ ...entry, scoreValues: [...entry.scoreValues] })),
    });
    await saveProfileFile(blob, profileFileName(new Date()));
  } catch {
    showToast('danger', t('export.failed'));
  }
}

async function importProfile(): Promise<void> {
  emit('importStarted');
  const file = await pickFile();
  if (file === null) return;
  const result = await decodeProfileFile(file);
  if (!result.ok) {
    showToast('danger', t(`failure.${result.reason}`));
    return;
  }
  incoming.value = { data: result.data, skipped: result.skipped };
  // The dialog gets its props on the next render.
  await Promise.resolve();
  dialog.value?.open();
}

function merge(): void {
  if (incoming.value) applyImport(incoming.value.data, scoringOf);
  dialog.value?.close();
  incoming.value = null;
  showToast('success', t('toast.merged'));
}

function cancel(): void {
  dialog.value?.close();
  incoming.value = null;
}
</script>

<template>
  <section class="backup">
    <p v-if="!supported" class="backup-unsupported">{{ t('unsupported.hint') }}</p>
    <div v-else class="backup-actions">
      <span class="backup-heading">{{ t('section.heading') }}</span>
      <AppButton class="backup-export" @click="exportProfile">
        <template #icon><IconDownload /></template>
        {{ t('export.button') }}
      </AppButton>
      <AppButton
        class="backup-import"
        :disabled="roundState === 'running'"
        :aria-describedby="roundState === 'running' ? hintId : undefined"
        @click="importProfile"
      >
        <template #icon><IconUpload /></template>
        {{ t('import.button') }}
      </AppButton>
    </div>
    <p v-if="supported && roundState === 'running'" :id="hintId" class="backup-hint">
      {{ t('import.disabledDuringRound') }}
    </p>
    <Teleport to="body">
      <ImportDialog
        v-if="incoming"
        ref="dialog"
        :data="incoming.data"
        :skipped="incoming.skipped"
        @merge="merge"
        @cancel="cancel"
      />
    </Teleport>
  </section>
</template>

<style scoped>
.backup-heading {
  font-weight: 600;
}

.backup-hint {
  margin-block: var(--spacing-xs) 0;
  font-size: 0.875rem;
}

.backup-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* Compact buttons for the popover. The parent class beats the base rules of AppButton. */
.backup-actions .backup-export,
.backup-actions .backup-import {
  min-inline-size: 0;
  min-block-size: 2rem;
  padding-inline: var(--spacing-sm);
  font-size: 0.875rem;
}
</style>
