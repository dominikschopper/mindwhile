import { inject, provide, type InjectionKey } from 'vue';

export interface LayerRegistry {
  register(close: () => void): () => void;
  closeTopmost(): boolean;
}

// Exported for tests only, not from the package index.
export const layersKey = Symbol.for('mindwhile.layers') as InjectionKey<LayerRegistry>;

export function createLayerRegistry(): LayerRegistry {
  const layers: { close: () => void }[] = [];

  return {
    register(close) {
      const layer = { close };
      layers.push(layer);
      return () => {
        const index = layers.indexOf(layer);
        if (index !== -1) {
          layers.splice(index, 1);
        }
      };
    },
    closeTopmost() {
      const top = layers[layers.length - 1];
      if (!top) {
        return false;
      }
      top.close();
      return true;
    },
  };
}

export function provideLayers(registry: LayerRegistry): void {
  provide(layersKey, registry);
}

export function useLayers(): LayerRegistry | undefined {
  return inject(layersKey, undefined);
}
