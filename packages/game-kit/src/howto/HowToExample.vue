<script setup lang="ts">
defineProps<{ caption?: string }>()
</script>

<template>
  <figure class="how-to-example">
    <div class="how-to-example-box">
      <slot />
    </div>
    <figcaption v-if="caption" class="how-to-example-caption">
      {{ caption }}
    </figcaption>
  </figure>
</template>

<style scoped>
.how-to-example {
  margin: var(--spacing-md) 0;
  padding: 0;
}

.how-to-example-box {
  padding: var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background-color: var(--surface-raised-color);
}

.how-to-example-caption {
  margin-top: var(--spacing-sm);
  color: var(--text-color);
  font-size: 0.9rem;
}
</style>
