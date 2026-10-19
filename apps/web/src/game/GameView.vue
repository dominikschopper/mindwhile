<script setup lang="ts">
import { gameSymbols } from '@mindwhile/game-kit'
import { computed, onMounted, ref, shallowRef } from 'vue'
import type { Component } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { discoverGames } from '../common/composables/discoverGames'
import { gameTexts } from '../common/composables/game-texts'
import { loadGameModule } from '../common/composables/load-game-module'
import { useBestResults } from '../common/composables/use-best-results'
import { useSelectedChallenge } from './use-selected-challenge'
import { t } from './texts'

const props = defineProps<{ id: string }>()
const router = useRouter()

const manifest = discoverGames().find((game) => game.id === props.id)
const texts = gameTexts[props.id]
const selected = useSelectedChallenge(props.id, manifest?.challenges ?? [])
const symbol = manifest ? (gameSymbols as Record<string, Component>)[manifest.symbol] : undefined

const options = (manifest?.challenges ?? []).map((challenge) => ({
  id: challenge,
  label: texts?.challengeName(challenge) ?? challenge,
}))

const bestResults = useBestResults()
const best = computed(() => bestResults[props.id]?.[selected.value])

const HowToPlay = shallowRef<Component | null>(null)
const rulesFailed = ref(false)

onMounted(async () => {
  if (!manifest) return
  try {
    HowToPlay.value = (await loadGameModule(props.id)).HowToPlay
  } catch {
    rulesFailed.value = true
  }
})

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
    <div class="challenge-row">
      <label for="challenge-select">{{ t('challenge.label') }}</label>
      <select id="challenge-select" v-model="selected">
        <option v-for="option in options" :key="option.id" :value="option.id">
          {{ option.label }}
        </option>
      </select>
      <button type="button" class="go" @click="go">{{ t('challenge.go') }}</button>
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

.challenge-row {
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
