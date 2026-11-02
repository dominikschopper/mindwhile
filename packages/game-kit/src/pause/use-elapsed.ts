import type { ActiveClock } from '@mindwhile/core';
import { onScopeDispose, readonly, ref, type Ref } from 'vue';

export function useElapsed(
  clock: Pick<ActiveClock, 'elapsedMs' | 'isRunning' | 'subscribe'>,
  intervalMs = 250,
): Readonly<Ref<number>> {
  const elapsed = ref(clock.elapsedMs());
  let timer: ReturnType<typeof setInterval> | undefined;

  function update(): void {
    elapsed.value = clock.elapsedMs();
  }

  function startTimer(): void {
    if (timer !== undefined) {
      return;
    }
    timer = setInterval(update, intervalMs);
  }

  function stopTimer(): void {
    if (timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  }

  if (clock.isRunning()) {
    startTimer();
  }

  const unsubscribe = clock.subscribe((running) => {
    if (running) {
      update();
      startTimer();
    } else {
      stopTimer();
      update();
    }
  });

  onScopeDispose(() => {
    stopTimer();
    unsubscribe();
  });

  return readonly(elapsed);
}
