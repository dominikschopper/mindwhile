<script setup lang="ts">
import { computed } from 'vue';
import '../common/styles/tokens.css';
import '../common/styles/jelly-colors.css';
import { levelParams } from '../common/levels/levels';

const props = defineProps<{ level: string }>();

const PREVIEW_LAYERS = 3;

const params = computed(
  () => levelParams[props.level as keyof typeof levelParams] ?? levelParams.a,
);

// One tray per color plus the empty ones. Colored trays hold a few layers in a fixed pattern,
// the same on every render.
const trays = computed(() => {
  const { colors, emptyTrays } = params.value;
  const list: number[][] = [];
  for (let tray = 0; tray < colors; tray++) {
    list.push(
      Array.from({ length: 1 + (tray % PREVIEW_LAYERS) }, (_, i) => (tray + i * 2) % colors),
    );
  }
  for (let i = 0; i < emptyTrays; i++) {
    list.push([]);
  }
  return list;
});

// Two rows with the same number of trays: 6 trays give 3 + 3, 8 give 4 + 4, 10 give 5 + 5.
const columns = computed(() => Math.ceil(trays.value.length / 2));
</script>

<template>
  <div
    class="level-preview"
    aria-hidden="true"
    :data-columns="columns"
    :style="{ '--columns': columns }"
  >
    <span v-for="(layers, index) in trays" :key="index" class="preview-tray">
      <span v-for="(color, layer) in layers" :key="layer" :class="`jelly--${color}`" />
    </span>
  </div>
</template>

<style scoped>
.level-preview {
  display: grid;
  grid-template-columns: repeat(var(--columns), auto);
  align-items: end;
  justify-content: center;
  gap: 0.2rem;
}

.preview-tray {
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-start;
  width: 0.45rem;
  height: 1.3rem;
  border: 1px solid var(--text-color);
  border-top: none;
  border-radius: 0 0 0.15rem 0.15rem;
  box-sizing: border-box;
  overflow: hidden;
}

.preview-tray > span {
  flex: none;
  height: 0.3rem;
}
</style>
