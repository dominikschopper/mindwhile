import type { Plugin } from 'vite'

const layerOrder = '@layer reset,tokens,layout,components,utilities;'

/**
 * The CSS minifier drops the explicit layer order statement and merges it into
 * the first layer blocks. This puts it back in front of every built CSS file,
 * so the order is declared before any layer content.
 */
export const layerOrderFirst = (): Plugin => ({
  name: 'mindwhile-layer-order-first',
  apply: 'build',
  enforce: 'post',
  generateBundle(_options, bundle) {
    for (const file of Object.values(bundle)) {
      if (file.type !== 'asset' || !file.fileName.endsWith('.css')) continue
      const css = String(file.source)
      if (css.includes(layerOrder)) continue
      file.source = layerOrder + css
    }
  },
})
