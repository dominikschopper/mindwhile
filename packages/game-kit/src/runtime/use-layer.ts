import { onScopeDispose, watch, type Ref } from 'vue';
import { useLayers } from './layers';

export function useLayer(isOpen: Readonly<Ref<boolean>>, close: () => void): void {
  const registry = useLayers();
  if (!registry) {
    return;
  }

  let unregister: (() => void) | undefined;

  function release(): void {
    unregister?.();
    unregister = undefined;
  }

  watch(
    isOpen,
    (open) => {
      if (open && !unregister) {
        unregister = registry!.register(close);
      } else if (!open) {
        release();
      }
    },
    { immediate: true, flush: 'sync' },
  );

  onScopeDispose(release);
}
