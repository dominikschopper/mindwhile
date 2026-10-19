<template>
  <p class="how-to-paragraph">
    <slot />
  </p>
</template>

<style scoped>
.how-to-paragraph {
  margin: 0 0 var(--spacing-md);
  color: var(--text-color);
  line-height: 1.5;
}
</style>
