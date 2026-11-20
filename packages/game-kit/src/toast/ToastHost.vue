<script setup lang="ts">
/**
 * Renders the toasts of a queue, floating under the sticky header.
 * Offset: the host is `position: fixed` at `top: var(--app-header-height, 0px)`;
 * `AppHeader` publishes its measured height under that name (no magic number).
 * Z-order: 15 is above the header (10) and page content, below the menu popover (20).
 * Native dialogs live in the top layer and stay above everything.
 */
import type { Toast, ToastQueue, ToastType } from '@mindwhile/core';
import { computed, onBeforeUnmount, ref, type Component } from 'vue';
import {
  IconCircleCheck,
  IconClose,
  IconInfo,
  IconOctagonAlert,
  IconTriangleAlert,
} from '../icons';
import { useToastQueue } from '../runtime/toasts';
import { createToastTimers, focusLeftCard, type CardFocusEvent } from './toast-timers';

const props = defineProps<{ dismissLabel: string; queue?: ToastQueue }>();

const injected = useToastQueue();
const activeQueue = computed(() => props.queue ?? injected);

const icons: Record<ToastType, Component> = {
  info: IconInfo,
  success: IconCircleCheck,
  warning: IconTriangleAlert,
  danger: IconOctagonAlert,
};

const toasts = ref<Toast[]>([]);
const timers = createToastTimers((id) => activeQueue.value?.dismiss(id));
let unsubscribe: (() => void) | undefined;

function sync(queue: ToastQueue): void {
  const list = queue.list();
  timers.sync(list);
  toasts.value = list;
}

function onFocusOut(id: number, event: CardFocusEvent): void {
  if (focusLeftCard(event)) {
    timers.resume(id, 'focused');
  }
}

// Subscribe synchronously (setup), the queue is fixed for the lifetime of the host.
const subscribedTo = activeQueue.value;
if (subscribedTo) {
  unsubscribe = subscribedTo.subscribe(() => sync(subscribedTo));
  sync(subscribedTo);
}

onBeforeUnmount(() => {
  unsubscribe?.();
  timers.clear();
});
</script>

<template>
  <div v-if="activeQueue" class="toast-host">
    <TransitionGroup name="toast" tag="div" class="toast-list">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="`toast-${toast.type}`"
        :role="toast.type === 'info' || toast.type === 'success' ? 'status' : 'alert'"
        @mouseenter="timers.pause(toast.id, 'hovered')"
        @mouseleave="timers.resume(toast.id, 'hovered')"
        @focusin="timers.pause(toast.id, 'focused')"
        @focusout="onFocusOut(toast.id, $event)"
      >
        <component :is="icons[toast.type]" class="toast-icon" />
        <div class="toast-body">
          <strong v-if="toast.title" class="toast-title">{{ toast.title }}</strong>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
        <button
          type="button"
          class="toast-close"
          :aria-label="dismissLabel"
          @click="activeQueue.dismiss(toast.id)"
        >
          <span class="toast-close-circle"><IconClose :size="16" /></span>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: var(--app-header-height, 0px);
  inset-inline: 0;
  z-index: 15;
  display: flex;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-md);
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: min(28rem, 100%);
}

.toast {
  --toast-color: var(--accent-color);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-xs) var(--spacing-sm) var(--spacing-md);
  color: var(--text-color);
  background: var(--surface-raised-color);
  border: 1px solid var(--border-color);
  border-inline-start: 5px solid var(--toast-color);
  border-radius: var(--radius);
  box-shadow: var(--shadow-raised);
  pointer-events: auto;
  overflow-wrap: anywhere;
}

.toast-success {
  --toast-color: var(--success-color);
}

.toast-warning {
  --toast-color: var(--warning-color);
}

.toast-danger {
  --toast-color: var(--danger-color);
}

.toast-icon {
  flex: none;
  margin-block-start: 0.1rem;
  color: var(--toast-color);
}

.toast-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.toast-close {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin: -8px 0;
  padding: 0;
  color: inherit;
  background: none;
  border: 0;
  cursor: pointer;
}

.toast-close-circle {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
}

.toast-close:hover .toast-close-circle {
  background: color-mix(in srgb, var(--text-color) 10%, transparent);
}

.toast-close:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: -4px;
  border-radius: 50%;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
}
</style>
