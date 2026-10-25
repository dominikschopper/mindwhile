<script setup lang="ts">
import { AppFooter, AppHeader, IconClose, IconUserStar } from '@mindwhile/game-kit'
import { RouterLink, RouterView } from 'vue-router'
import MainMenu from './common/components/MainMenu.vue'
import NoticeBar from './common/components/NoticeBar.vue'
import { requestAbort, roundState } from './common/composables/use-chrome'
import { t } from './common/texts'
</script>

<template>
  <AppHeader>
    <template #left>
      <RouterLink to="/" class="app-name">{{ t('app.name') }}</RouterLink>
    </template>
    <template #right>
      <MainMenu />
    </template>
  </AppHeader>
  <NoticeBar />
  <main class="content-column">
    <RouterView />
  </main>
  <AppFooter>
    <template #left>
      <span class="gamer-tag" :title="t('footer.gamerTagLabel')">
        <IconUserStar aria-hidden="true" />{{ t('footer.gamerTag') }}
      </span>
    </template>
    <template #right>
      <button
        v-if="roundState === 'running'"
        type="button"
        class="chrome-button"
        @click="requestAbort"
      >
        <IconClose />{{ t('footer.abort') }}
      </button>
      <RouterLink v-else to="/" class="chrome-button">{{ t('footer.backToGames') }}</RouterLink>
    </template>
  </AppFooter>
</template>

<style scoped>
.gamer-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
}
</style>
