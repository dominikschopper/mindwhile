<script setup lang="ts">
import { highestChallengeWithResult } from '@mindwhile/core'
import { gameSymbols } from '@mindwhile/game-kit'
import { RouterLink } from 'vue-router'
import { discoverGames } from '../common/composables/discoverGames'
import { gameTexts } from '../common/composables/game-texts'
import { useBestResults } from '../common/composables/use-best-results'
import { t } from './texts'

const bestResults = useBestResults()

const games = discoverGames().map((game) => {
  const texts = gameTexts[game.id]
  const best = highestChallengeWithResult(game.challenges, bestResults[game.id] ?? {})
  return {
    id: game.id,
    name: texts?.name ?? game.id,
    symbol: (gameSymbols as Record<string, (typeof gameSymbols)[keyof typeof gameSymbols]>)[
      game.symbol
    ],
    best: best
      ? { score: best.result, label: texts?.challengeName(best.challenge) ?? best.challenge }
      : undefined,
  }
})
</script>

<template>
  <div class="game-selection">
    <h1>{{ t('page.heading') }}</h1>
    <ul class="tiles">
      <li v-for="game in games" :key="game.id">
        <RouterLink :to="`/games/${game.id}`" class="tile">
          <component :is="game.symbol" v-if="game.symbol" class="tile-symbol" aria-hidden="true" />
          <span class="tile-name">{{ game.name }}</span>
          <span v-if="game.best" class="tile-result">
            {{ game.best.score }} · <small>{{ game.best.label }}</small>
          </span>
          <span v-else class="tile-result">
            <span aria-hidden="true">—</span>
            <span class="visually-hidden">{{ t('tile.noResult') }}</span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: var(--spacing-md);
  margin: 0;
  padding: 0;
  list-style: none;
}

.tile {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  height: 100%;
  min-height: 8rem;
  padding: var(--card-padding);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--surface-raised-color);
  color: var(--text-color);
  text-align: center;
  text-decoration: none;
}

.tile:hover {
  border-color: var(--accent-color);
}

.tile:focus-visible {
  outline: 3px solid var(--focus-ring-color);
  outline-offset: 2px;
}

.tile-symbol {
  width: 3rem;
  height: 3rem;
}

.tile-name {
  font-weight: 600;
}

.tile-result {
  font-size: 0.875rem;
}
</style>
