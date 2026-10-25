import { ref } from 'vue'

/**
 * One-time notice shown by the platform shell (see `NoticeBar.vue`).
 * Only one notice is shown at a time: a newer notice replaces the older one.
 */
export const notice = ref<string | null>(null)

export function showNotice(text: string): void {
  notice.value = text
}

export function dismissNotice(): void {
  notice.value = null
}
