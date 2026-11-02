import { createActivitySignal, type ActivitySignal } from '@mindwhile/core';
import { inject, provide, type InjectionKey } from 'vue';

// Exported for tests only, not from the package index. Symbol.for keeps the key
// identical even if game-kit ends up twice in a bundle.
export const activityKey = Symbol.for('mindwhile.activity') as InjectionKey<ActivitySignal>;

let fallback: ActivitySignal | undefined;

function getFallback(): ActivitySignal {
  fallback ??= createActivitySignal(true);
  return fallback;
}

export function provideActivity(signal: ActivitySignal): void {
  provide(activityKey, signal);
}

export function useActivity(): ActivitySignal {
  return inject(activityKey, getFallback, true);
}
