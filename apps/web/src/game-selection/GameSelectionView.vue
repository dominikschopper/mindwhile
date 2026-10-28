<script setup lang="ts">
import { highestLevelWithResult } from '@mindwhile/core'
import { gameSymbols } from '@mindwhile/game-kit'
import { useGameRegistry } from '../common/composables/game-registry'
import { pointsOf, useBestResults } from '../common/composables/use-best-results'
import GameTile from './GameTile.vue'
import { t } from './texts'

const bestResults = useBestResults()

const games = useGameRegistry()
  .listGames()
  .map(({ manifest: game, texts }) => {
    const best = highestLevelWithResult(game.levels, bestResults[game.id] ?? {})
    const points = best ? pointsOf(best.result) : undefined
    return {
      id: game.id,
      name: texts.name,
      color: game.color,
      symbol: (gameSymbols as Record<string, (typeof gameSymbols)[keyof typeof gameSymbols]>)[
        game.symbol
      ],
      best:
        best && points !== undefined
          ? { points, levelLabel: texts.levelName(best.level) ?? best.level }
          : undefined,
    }
  })
</script>

<template>
  <div class="game-selection">
    <h1>{{ t('page.heading') }}</h1>
    <ul class="tiles">
      <li v-for="game in games" :key="game.id">
        <GameTile v-bind="game" />
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
</style>
