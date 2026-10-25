import { readonly, ref } from 'vue'

export type ThemeChoice = 'system' | 'light' | 'dark'

// Session only: the choice is not persisted, storage belongs to the platform.
const choice = ref<ThemeChoice>('system')

function apply(value: ThemeChoice): void {
  const root = document.documentElement
  if (value === 'system') {
    delete root.dataset.theme
  } else {
    root.dataset.theme = value
  }
}

function setTheme(value: ThemeChoice): void {
  choice.value = value
  apply(value)
}

export function useTheme() {
  return { choice: readonly(choice), setTheme }
}
