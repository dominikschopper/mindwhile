<script setup lang="ts">
import { gameSymbols } from '@mindwhile/game-kit'
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

const options = computed(() =>
  (manifest.value?.levels ?? []).map((level) => ({
    id: level,
    label: texts.value?.levelName(level) ?? level,
  })),
)

const selected = computed({
  get: () => useSelectedLevel(props.id, manifest.value?.levels ?? []).value,
  set: (value: string) => {
    useSelectedLevel(props.id, manifest.value?.levels ?? []).value = value
  },
})
const best = computed(() => pointsOf(bestResults[props.id]?.[selected.value]))

const HowToPlay = shallowRef<Component | null>(null)
const rulesFailed = ref(false)

// Loads the rules of the game in the route. A rules load for a previous id is dropped.
watch(
  () => props.id,
  async (id) => {
    HowToPlay.value = null
    rulesFailed.value = false
    const entry = registry.getGame(id)
    if (!entry) return
    try {
      const { HowToPlay: rules } = await entry.loadModule()
      if (props.id === id) HowToPlay.value = rules
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
  <div v-else class="game-page">
    <div class="game-title">
      <component :is="symbol" v-if="symbol" class="game-symbol" aria-hidden="true" />
      <h1>{{ texts?.name ?? props.id }}</h1>
    </div>
    <div class="level-row">
      <label for="level-select">{{ t('level.label') }}</label>
      <select id="level-select" :key="props.id" v-model="selected">
        <option v-for="option in options" :key="option.id" :value="option.id">
          {{ option.label }}
        </option>
      </select>
      <button type="button" class="go" @click="go">{{ t('level.go') }}</button>
    </div>
    <p class="best">
      {{ t('best.label') }}:
      <template v-if="best !== undefined">{{ best }}</template>
      <template v-else>
        <span aria-hidden="true">—</span>
        <span class="visually-hidden">{{ t('best.none') }}</span>
      </template>
    </p>
    <h2>{{ t('rules.heading') }}</h2>
    <component :is="HowToPlay" v-if="HowToPlay" />
    <p v-else-if="rulesFailed" role="alert">{{ t('rules.error') }}</p>
    <p v-else>{{ t('rules.loading') }}</p>
  </div>
</template>

<style scoped>
.game-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.game-title h1 {
  margin: 0;
}

.game-symbol {
  width: 3rem;
  height: 3rem;
}

.level-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
  margin-block: var(--spacing-md);
}

.best {
  margin: 0 0 var(--spacing-md);
  font-size: 0.875rem;
}
</style>
