<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ThemeSwitch from '../common/components/ThemeSwitch.vue'
import { discoverGames } from '../common/composables/discoverGames'
import { gameTexts } from '../common/composables/game-texts'
import { t } from './texts'

const games = discoverGames().map((game) => {
  const texts = gameTexts[game.id]
  return {
    id: game.id,
    name: texts?.name ?? game.id,
    challenges: game.challenges.map((challenge) => ({
      id: challenge,
      name: texts?.challengeName(challenge) ?? challenge,
    })),
  }
})
</script>

<template>
  <main class="page">
    <header class="page-header">
      <h1>{{ t('page.heading') }}</h1>
      <ThemeSwitch />
    </header>
    <section v-for="game in games" :key="game.id" class="game">
      <h2>{{ game.name }}</h2>
      <ul class="challenges" :aria-label="t('challenge.list', { game: game.name })">
        <li v-for="challenge in game.challenges" :key="challenge.id">
          <RouterLink :to="`/play/${game.id}/${challenge.id}`">{{ challenge.name }}</RouterLink>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.challenges {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

.challenges a {
  display: flex;
  align-items: center;
  min-height: var(--button-min-size);
  padding-inline: var(--card-padding);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--surface-raised-color);
  color: var(--text-color);
  text-decoration: none;
}
</style>
