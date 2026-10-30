<script setup lang="ts">
import { highestLevelWithResult } from '@mindwhile/core'
import { IconPuzzle, gameSymbols } from '@mindwhile/game-kit'
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
    <section class="hero">
      <h1>{{ t('page.heading') }}</h1>
      <p>{{ t('page.intro') }}</p>
    </section>
    <ul class="tiles">
      <li v-for="game in games" :key="game.id">
        <GameTile v-bind="game" />
      </li>
    </ul>
    <section class="coming-soon">
      <IconPuzzle class="coming-soon-icon" :size="32" />
      <div>
        <h2>{{ t('comingSoon.heading') }}</h2>
        <p>{{ t('comingSoon.text') }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.game-selection {
  /* The hero reacts to the width of the page column, not of the viewport. */
  container-type: inline-size;
  max-width: 960px;
  margin-inline: auto;
}
.hero {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--accent-color) 18%, var(--surface-raised-color)),
    var(--surface-raised-color)
  );
  box-shadow: var(--shadow-card);
  color: var(--text-color);
}
.hero h1 {
  margin: 0 0 var(--spacing-sm);
}
.hero p {
  margin: 0;
}

/* Narrow column (below 60ch, about the length of the subline): only the heading, no subline, less height. */
@container (max-width: 60ch) {
  .hero {
    margin-bottom: var(--spacing-lg);
    padding: var(--spacing-md) var(--spacing-lg);
  }
  .hero h1 {
    margin: 0;
    font-size: 1.5rem;
  }
  .hero p {
    display: none;
  }
}
.coming-soon {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-color);
}
.coming-soon-icon {
  flex: none;
  color: var(--accent-color);
}
.coming-soon h2 {
  margin: 0 0 var(--spacing-xs);
}
.coming-soon p {
  margin: 0;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 18rem));
  justify-content: center;
  gap: var(--spacing-md);
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
