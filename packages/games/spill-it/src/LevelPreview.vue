<script setup lang="ts">
import { computed } from 'vue'
import './styles/tokens.css'
import { levelParams } from './levels'
import type { SpillItLevel } from './manifest'

const props = defineProps<{ level: string }>()

const params = computed(() => levelParams[props.level as SpillItLevel] ?? levelParams.a)
const cells = computed(() => {
  const { size, colors } = params.value
  // Fixed pattern: diagonal stripes with a small column shift, same for every render.
  return Array.from({ length: size * size }, (_, i) => {
    const row = Math.floor(i / size)
    const column = i % size
    return (row * 2 + column + Math.floor(row / 3)) % colors
  })
})
</script>

<template>
  <div class="level-preview" :style="{ '--size': params.size }" aria-hidden="true">
    <span v-for="(color, index) in cells" :key="index" :class="`preview-cell--${color}`" />
  </div>
</template>

<style scoped>
.level-preview {
  display: grid;
  grid-template-columns: repeat(var(--size), 1fr);
  grid-template-rows: repeat(var(--size), 1fr);
  width: 4.5rem;
  aspect-ratio: 1;
  border-radius: 0.25rem;
  overflow: hidden;
}

.preview-cell--0 {
  background-color: var(--spill-it-color-0);
}
.preview-cell--1 {
  background-color: var(--spill-it-color-1);
}
.preview-cell--2 {
  background-color: var(--spill-it-color-2);
}
.preview-cell--3 {
  background-color: var(--spill-it-color-3);
}
.preview-cell--4 {
  background-color: var(--spill-it-color-4);
}
.preview-cell--5 {
  background-color: var(--spill-it-color-5);
}
</style>
