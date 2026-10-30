<script setup lang="ts">
import { AppButton, IconChevronDown, IconPlay, LevelPicker, gameSymbols } from '@mindwhile/game-kit'
import { computed, ref, shallowRef, watch } from 'vue'
import type { Component } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useGameRegistry } from '../common/composables/game-registry'
import { pointsOf, useBestResults } from '../common/composables/use-best-results'
import { useSelectedLevel } from './use-selected-level'
import { t } from './texts'

const props = defineProps<{ id: string }>()
const router = useRouter()
const registry = useGameRegistry()
const bestResults = useBestResults()

const game = computed(() => registry.getGame(props.id))
const manifest = computed(() => game.value?.manifest)
const texts = computed(() => game.value?.texts)
const symbol = computed(() =>
  manifest.value ? (gameSymbols as Record<string, Component>)[manifest.value.symbol] : undefined,
)

function bestPoints(level: string): string | undefined {
  const points = pointsOf(bestResults[props.id]?.[level])
  return points === undefined ? undefined : String(points)
}

const options = computed(() =>
  (manifest.value?.levels ?? []).map((level) => ({
    id: level,
    label: texts.value?.levelName(level) ?? level,
    best: bestPoints(level),
  })),
)

const selected = computed({
  get: () => useSelectedLevel(props.id, manifest.value?.levels ?? []).value,
  set: (value: string) => {
    useSelectedLevel(props.id, manifest.value?.levels ?? []).value = value
  },
})
const selectedName = computed(() => texts.value?.levelName(selected.value) ?? selected.value)
const best = computed(() => pointsOf(bestResults[props.id]?.[selected.value]))

const HowToPlay = shallowRef<Component | null>(null)
const LevelPreview = shallowRef<Component | null>(null)
const rulesFailed = ref(false)

// Loads the rules of the game in the route. A rules load for a previous id is dropped.
watch(
  () => props.id,
  async (id) => {
    HowToPlay.value = null
    LevelPreview.value = null
    rulesFailed.value = false
    const entry = registry.getGame(id)
    if (!entry) return
    try {
      const { HowToPlay: rules, LevelPreview: preview } = await entry.loadModule()
      if (props.id === id) {
        HowToPlay.value = rules
        LevelPreview.value = preview ?? null
      }
    } catch {
      if (props.id === id) rulesFailed.value = true
    }
  },
  { immediate: true },
)

function go(): void {
  void router.push(`/play/${props.id}/${selected.value}`)
}
</script>

<template>
  <div v-if="!manifest" class="game-page">
    <p role="alert">{{ t('error.notFound') }}</p>
    <RouterLink to="/">{{ t('error.back') }}</RouterLink>
  </div>
  <div v-else class="game-page" :class="`game-color-${manifest.color}`">
    <header class="game-header">
      <span class="game-symbol-tile" aria-hidden="true">
        <component :is="symbol" v-if="symbol" class="game-symbol" />
      </span>
      <div class="game-header-text">
        <h1>{{ texts?.name ?? props.id }}</h1>
        <p class="game-tagline">{{ texts?.tagline }}</p>
      </div>
      <p class="game-summary">{{ texts?.summary }}</p>
      <details class="rules">
        <summary>
          <span>{{ t('rules.summary') }}</span>
          <IconChevronDown class="rules-chevron" aria-hidden="true" />
        </summary>
        <div class="rules-body">
          <component :is="HowToPlay" v-if="HowToPlay" />
          <p v-else-if="rulesFailed" role="alert">{{ t('rules.error') }}</p>
          <p v-else>{{ t('rules.loading') }}</p>
        </div>
      </details>
    </header>
    <h2 class="level-heading">{{ t('level.heading') }}</h2>
    <LevelPicker
      v-model="selected"
      :levels="options"
      :legend="t('level.label')"
      :selected-label="t('level.selected')"
    >
      <template #step="{ level }">
        <component :is="LevelPreview" v-if="LevelPreview" :level="level" />
      </template>
    </LevelPicker>
    <div class="start-bar">
      <div class="start-info">
        <p class="start-ready">{{ t('start.ready') }}</p>
        <p class="start-level">{{ selectedName }}</p>
      </div>
      <p class="best">
        <span class="best-label">{{ t('best.label') }}</span>
        <span class="best-value">
          <template v-if="best !== undefined">{{ best }}</template>
          <template v-else>
            <span aria-hidden="true">—</span>
            <span class="visually-hidden">{{ t('best.none') }}</span>
          </template>
        </span>
      </p>
      <AppButton variant="primary" class="go" @click="go">
        <IconPlay aria-hidden="true" />{{ t('start.button', { level: selectedName }) }}
      </AppButton>
    </div>
  </div>
</template>

<style scoped>
.game-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
}

.game-header {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--surface-raised-color);
  box-shadow: var(--shadow-card);
}

.game-symbol-tile {
  display: grid;
  place-items: center;
  width: 4rem;
  height: 4rem;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--game-color), var(--game-color-deep));
  color: var(--on-game-color);
  box-shadow: var(--shadow-raised);
}

.game-symbol {
  width: 2.25rem;
  height: 2.25rem;
}

.game-header-text h1 {
  margin: 0;
  color: var(--game-color);
}

.game-tagline,
.game-summary {
  margin: 0;
}

.game-tagline {
  opacity: 0.8;
}

.game-summary,
.rules {
  grid-column: 1 / -1;
}

.rules {
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--surface-color);
}

.rules summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  min-height: var(--button-min-size);
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
  list-style: none;
}

.rules summary::-webkit-details-marker {
  display: none;
}

.rules summary:focus-visible {
  outline: 3px solid var(--focus-ring-color);
  outline-offset: 2px;
}

.rules-chevron {
  flex: none;
  transition: transform 0.2s;
}

@media (prefers-reduced-motion: reduce) {
  .rules-chevron {
    transition: none;
  }
}

.rules[open] .rules-chevron {
  transform: rotate(180deg);
}

.rules-body {
  padding: 0 var(--spacing-md) var(--spacing-md);
}

.level-heading {
  margin: var(--spacing-sm) 0 0;
  color: var(--game-color);
}

.start-bar {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--spacing-sm) var(--spacing-md);
  padding: var(--spacing-md);
  border: 2px solid var(--game-color);
  border-radius: var(--radius-lg);
  background: var(--surface-raised-color);
  box-shadow: var(--shadow-card);
}

.start-info p,
.best {
  margin: 0;
}

.start-ready {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.start-level {
  font-size: 1.125rem;
  font-weight: 700;
}

.best {
  display: flex;
  flex-direction: column;
  text-align: end;
}

.best-label {
  font-size: 0.75rem;
}

.best-value {
  font-weight: 700;
}

.go {
  grid-column: 1 / -1;
}

@media (min-width: 40rem) {
  .game-header {
    grid-template-columns: auto 1fr;
  }

  .start-bar {
    grid-template-columns: 1fr auto auto;
  }

  .go {
    grid-column: auto;
  }
}

@media (max-width: 39.999rem) {
  .start-bar {
    position: sticky;
    /* the app footer is sticky at the bottom too: sit on top of it, not behind it */
    bottom: calc(var(--button-min-size) + var(--spacing-xs) * 2 + 1px);
    z-index: 1;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
}
</style>
