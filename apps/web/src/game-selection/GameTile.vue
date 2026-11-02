<script setup lang="ts">
import type { GameColor } from '@mindwhile/core';
import type { Component } from 'vue';
import { RouterLink } from 'vue-router';
import { t } from './texts';

defineProps<{
  id: string;
  name: string;
  symbol?: Component;
  color: GameColor;
  hiScore?: string;
}>();
</script>

<template>
  <RouterLink :to="`/games/${id}`" class="tile" :class="`game-color-${color}`">
    <span class="tile-top">
      <span class="symbol-wrapper">
        <component :is="symbol" v-if="symbol" class="tile-symbol" aria-hidden="true" />
      </span>

      <span class="tile-name">{{ name }}</span>
    </span>

    <span class="tile-body">
      <span v-if="hiScore" class="tile-score">{{ t('tile.topResult', { score: hiScore }) }}</span>

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
  justify-content: flex-start;
  gap: var(--spacing-lg);
  min-height: 6rem;
  padding: var(--card-padding);
  color: var(--on-game-color);
}

.symbol-wrapper {
  background: linear-gradient(135deg, var(--game-color), var(--game-color-deep));
  padding: 1rem;
  border-radius: var(--radius-lg);
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
  font-size: 20px;
  font-weight: 700;
  overflow-wrap: anywhere;
  color: var(--game-color);
}

.tile-score {
  margin-top: auto;
  font-size: 1rem;
  font-weight: 600;
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
