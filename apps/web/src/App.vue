<script setup lang="ts">
import { AppButton, AppFooter, AppHeader, IconClose, IconUserStar } from '@mindwhile/game-kit'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import MainMenu from './common/components/MainMenu.vue'
import NoticeBar from './common/components/NoticeBar.vue'
import { requestAbort, roundState } from './common/composables/use-chrome'
import { t } from './common/texts'

const route = useRoute()
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
      <AppButton
        v-if="roundState === 'running'"
        variant="secondary"
        class="chrome-button"
        @click="requestAbort"
      >
        <template #icon><IconClose /></template>
        {{ t('footer.abort') }}
      </AppButton>
      <AppButton v-else-if="route.path !== '/'" :as="RouterLink" to="/" class="chrome-button">
        {{ t('footer.backToGames') }}
      </AppButton>
    </template>
  </AppFooter>
</template>

<style scoped>
.app-name {
  font-weight: 700;
  text-decoration: none;
}

.gamer-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
}
</style>
