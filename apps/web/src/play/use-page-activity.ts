import { createActivitySignal, type ActivitySignal } from '@mindwhile/core';
import { onScopeDispose } from 'vue';

// Feeds the activity signal from the page visibility: active while the document is visible,
// inactive when hidden (tab switch, locked screen). Call it inside a component setup or an effect scope.
export function usePageActivity(): ActivitySignal {
  const signal = createActivitySignal(document.visibilityState === 'visible');

  const onVisibilityChange = (): void => {
    signal.set(document.visibilityState === 'visible');
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  onScopeDispose(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
  });

  return signal;
}
