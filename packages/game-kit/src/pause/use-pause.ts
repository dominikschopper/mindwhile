import type { ActiveClock, ActivitySignal } from '@mindwhile/core';
import { onScopeDispose, readonly, ref, type Ref } from 'vue';
import { useActivity } from '../runtime/activity';
import { useLayer } from '../runtime/use-layer';

export interface UsePauseOptions {
  clock?: Pick<ActiveClock, 'pause' | 'resume'>;
  activity?: ActivitySignal;
  pauseOnReturn?: boolean;
}

export function usePause(options: UsePauseOptions = {}): {
  paused: Readonly<Ref<boolean>>;
  pause(): void;
  resume(): void;
  toggle(): void;
} {
  const { clock, pauseOnReturn = false } = options;
  const paused = ref(false);

  function pause(): void {
    if (paused.value) {
      return;
    }
    paused.value = true;
    clock?.pause();
  }

  function resume(): void {
    if (!paused.value) {
      return;
    }
    paused.value = false;
    clock?.resume();
  }

  function toggle(): void {
    if (paused.value) {
      resume();
    } else {
      pause();
    }
  }

  const readonlyPaused = readonly(paused);
  useLayer(readonlyPaused, resume);

  if (pauseOnReturn) {
    const unsubscribe = (options.activity ?? useActivity()).subscribe((active) => {
      if (active) {
        pause();
      }
    });
    onScopeDispose(unsubscribe);
  }

  return { paused: readonlyPaused, pause, resume, toggle };
}
