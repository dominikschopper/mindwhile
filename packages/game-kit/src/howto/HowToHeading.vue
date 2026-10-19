<script setup lang="ts">
withDefaults(defineProps<{ level?: 2 | 3 }>(), { level: 2 })
</script>

<template>
  <h2 v-if="level === 2" class="how-to-heading">
    <slot />
  </h2>
  <h3 v-else class="how-to-heading">
    <slot />
  </h3>
</template>

<style scoped>
.how-to-heading {
  margin: var(--spacing-lg) 0 var(--spacing-sm);
  color: var(--text-color);
  font-size: 1.25rem;
  line-height: 1.3;
}

h3.how-to-heading {
  margin-top: var(--spacing-md);
  font-size: 1.05rem;
}
</style>
