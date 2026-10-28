<script setup lang="ts">
import AppButton from '../buttons/AppButton.vue'
import { Comment, Text, ref, useId, useSlots, type VNode } from 'vue'

/**
 * Collapsible block for the details of a game's how-to-play text.
 * Collapsed on every mount. The button toggles the content, which is hidden
 * (not visible, not focusable) while collapsed. Renders nothing when the
 * default slot is empty.
 */
defineProps<{
  moreLabel: string
  lessLabel: string
}>()

const slots = useSlots()
const expanded = ref(false)
const contentId = `how-to-more-${useId()}`

function hasContent(): boolean {
  const nodes: VNode[] = slots.default?.() ?? []
  return nodes.some((node) => {
    if (node.type === Comment) return false
    if (node.type === Text && typeof node.children === 'string') {
      return node.children.trim() !== ''
    }
    if (Array.isArray(node.children)) return node.children.length > 0
    return true
  })
}

function toggle(): void {
  expanded.value = !expanded.value
}
</script>

<template>
  <div v-if="hasContent()" class="how-to-more">
    <AppButton
      class="how-to-more-button"
      :aria-expanded="expanded ? 'true' : 'false'"
      :aria-controls="contentId"
      @click="toggle"
    >
      {{ expanded ? lessLabel : moreLabel }}
    </AppButton>
    <div v-show="expanded" :id="contentId" class="how-to-more-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.how-to-more {
  margin: 0 0 var(--spacing-md);
}

.how-to-more-content {
  margin-block-start: var(--spacing-md);
}
</style>
