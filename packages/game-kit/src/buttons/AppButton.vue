<script setup lang="ts">
import type { Component } from 'vue'

/**
 * Shared button. Renders a native `<button>` by default.
 *
 * Link form: game-kit has no `vue-router` dependency. Pass `as="a"` with
 * `href`, or let the platform pass `RouterLink` as `as` together with `to`.
 * Extra attributes (`href`, `to`, ...) fall through to the rendered element.
 */
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger'
    as?: string | Component
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  { variant: 'secondary', as: 'button', type: 'button', disabled: false },
)

const isNativeButton = () => props.as === 'button'
</script>

<template>
  <component
    :is="as"
    class="app-button"
    :class="`app-button-${variant}`"
    :type="isNativeButton() ? type : undefined"
    :disabled="isNativeButton() && disabled ? true : undefined"
    :aria-disabled="!isNativeButton() && disabled ? 'true' : undefined"
    :tabindex="!isNativeButton() && disabled ? -1 : undefined"
  >
    <span v-if="$slots.icon" class="app-button-icon"><slot name="icon" /></span>
    <slot />
  </component>
</template>

<style scoped>
.app-button {
  --button-edge-color: var(--button-edge-tone);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  min-width: var(--button-min-size);
  min-height: var(--button-min-size);
  padding-inline: var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--surface-raised-color);
  color: var(--text-color);
  font: inherit;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 var(--button-edge-height) 0 var(--button-edge-color);
  transition:
    transform 80ms ease,
    box-shadow 80ms ease;
}

.app-button-primary {
  --button-edge-color: color-mix(in srgb, var(--accent-color) 65%, var(--button-edge-mix-color));
  border-color: var(--accent-color);
  background: var(--accent-color);
  color: var(--on-accent-color);
}

.app-button-danger {
  --button-edge-color: color-mix(in srgb, var(--danger-color) 65%, var(--button-edge-mix-color));
  border-color: var(--danger-color);
  background: var(--danger-color);
  color: var(--on-danger-color);
}

.app-button:active:not(:disabled, [aria-disabled='true']) {
  transform: translateY(var(--button-edge-height));
  box-shadow: 0 0 0 var(--button-edge-color);
}

.app-button:disabled,
.app-button[aria-disabled='true'] {
  opacity: 0.5;
  cursor: not-allowed;
}

.app-button:focus-visible {
  outline: 2px solid var(--focus-ring-color);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .app-button {
    transition: none;
  }
}
</style>
