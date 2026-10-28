<script setup lang="ts">
import type { GameColor } from '@mindwhile/core'
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import { t } from './texts'

defineProps<{
  id: string
  name: string
  symbol?: Component
  color: GameColor
  best?: { points: number; levelLabel: string }
}>()
</script>

<template>
  <RouterLink :to="`/games/${id}`" class="tile" :class="`game-color-${color}`">
    <component :is="symbol" v-if="symbol" class="tile-symbol" aria-hidden="true" />
    <span class="tile-name">{{ name }}</span>
    <span v-if="best" class="tile-pills">
      <span class="pill pill-level">{{ best.levelLabel }}</span>
      <span class="pill pill-score">{{ best.points }}</span>
    </span>
    <span v-else class="visually-hidden">{{ t('tile.noResult') }}</span>
  </RouterLink>
</template>

<style scoped>
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
  border: 2px solid var(--game-color);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--game-color) 12%, var(--surface-raised-color));
  color: var(--text-color);
  text-align: center;
  text-decoration: none;
}

.tile:hover {
  background: color-mix(in srgb, var(--game-color) 20%, var(--surface-raised-color));
}

.tile:focus-visible {
  outline: 3px solid var(--focus-ring-color);
  outline-offset: 2px;
}

.tile-symbol {
  width: 3rem;
  height: 3rem;
  color: var(--game-color);
}

.tile-name {
  max-width: 100%;
  font-weight: 600;
  overflow-wrap: anywhere;
}

/* Pills: position and colors are "to try", change them here. */
.tile-pills {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  width: 100%;
  margin-top: auto;
}

.pill {
  padding: 0.125rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.5;
}

.pill-level {
  background: var(--success-color);
  color: var(--on-success-color);
}

.pill-score {
  background: var(--danger-color);
  color: var(--on-danger-color);
}
</style>
