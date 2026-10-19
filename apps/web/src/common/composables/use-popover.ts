import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Open/close state for a popover: Escape closes and refocuses the trigger button,
 * pointer or click outside the root element closes it.
 */
export function usePopover(): {
  open: Ref<boolean>
  root: Ref<HTMLElement | null>
  button: Ref<HTMLButtonElement | null>
  close: () => void
  onKeydown: (event: KeyboardEvent) => void
} {
  const open = ref(false)
  const root = ref<HTMLElement | null>(null)
  const button = ref<HTMLButtonElement | null>(null)

  function close(): void {
    open.value = false
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && open.value) {
      close()
      button.value?.focus()
    }
  }

  function onOutside(event: Event): void {
    if (open.value && root.value && !root.value.contains(event.target as Node)) close()
  }

  onMounted(() => {
    document.addEventListener('pointerdown', onOutside)
    document.addEventListener('click', onOutside)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onOutside)
    document.removeEventListener('click', onOutside)
  })

  return { open, root, button, close, onKeydown }
}
