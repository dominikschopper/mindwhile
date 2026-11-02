<script setup lang="ts">
import {
  AppButton,
  AppFooter,
  AppHeader,
  IconClose,
  IconSymbolPlaceholder,
  profileSymbols,
} from '@mindwhile/game-kit';
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import MainMenu from './common/components/MainMenu.vue';
import NoticeBar from './common/components/NoticeBar.vue';
import { requestAbort, roundState } from './common/composables/use-chrome';
import { useProfile } from './common/profile/use-profile';
import { t } from './common/texts';

const route = useRoute();
const { profile } = useProfile();

// Own keys only: a stored name like "constructor" must not reach the prototype.
const gamerSymbol = computed(() =>
  Object.hasOwn(profileSymbols, profile.value.gamerSymbol)
    ? profileSymbols[profile.value.gamerSymbol as keyof typeof profileSymbols]
    : IconSymbolPlaceholder,
);
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
        <component :is="gamerSymbol" aria-hidden="true" />{{ profile.gamerTag }}
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
