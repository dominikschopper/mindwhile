import { ref } from 'vue'

export type RoundState = 'idle' | 'running' | 'ended'

/**
 * Shared state of the platform frame (footer). The play page drives it:
 * it sets the round state and registers the abort handler while a round runs.
 * The footer reads `roundState` and calls `requestAbort()` from its abort button.
 */
export const roundState = ref<RoundState>('idle')

let abortHandler: (() => void) | null = null

export function setRoundState(state: RoundState): void {
  roundState.value = state
}

/** Registers the abort handler; pass `null` to remove it. */
export function registerAbortHandler(fn: (() => void) | null): void {
  abortHandler = fn
}

export function requestAbort(): void {
  abortHandler?.()
}
