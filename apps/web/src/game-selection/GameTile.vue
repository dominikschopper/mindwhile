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
    <span class="tile-top">
      <component :is="symbol" v-if="symbol" class="tile-symbol" aria-hidden="true" />
    </span>
    <span class="tile-body">
      <span class="tile-name">{{ name }}</span>
      <span v-if="best" class="tile-pills">
        <span class="pill pill-level">{{ best.levelLabel }}</span>
        <span class="pill pill-score">{{ best.points }}</span>
      </span>
      <span v-else class="visually-hidden">{{ t('tile.noResult') }}</span>
    </span>
  </RouterLink>
</template>

<style scoped>
.tile {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 18rem;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--surface-raised-color);
  color: var(--text-color);
  text-decoration: none;
  box-shadow: var(--shadow-card);
  transition:
    transform 120ms ease,
    box-shadow 120ms ease;
}

.tile:hover,
.tile:focus-visible {
  transform: translateY(-2px);
  box-shadow: var(--shadow-raised);
}

.tile:focus-visible {
  outline: 3px solid var(--focus-ring-color);
  outline-offset: 3px;
}

.tile-top {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 6rem;
  padding: var(--card-padding);
  background: linear-gradient(135deg, var(--game-color), var(--game-color-deep));
  color: var(--on-game-color);
}

.tile-symbol {
  width: 3.5rem;
  height: 3.5rem;
  color: var(--on-game-color);
}

.tile-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--card-padding);
  background: var(--surface-raised-color);
  color: var(--text-color);
}

.tile-name {
  max-width: 100%;
  font-weight: 700;
  overflow-wrap: anywhere;
}

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
  border-radius: var(--radius-pill);
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

@media (prefers-reduced-motion: reduce) {
  .tile {
    transition: none;
  }

  .tile:hover,
  .tile:focus-visible {
    transform: none;
  }
}
</style>
