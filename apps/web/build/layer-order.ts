import type { Plugin } from 'vite'

const layerOrder = '@layer reset,tokens,layout,components,utilities;'

/**
 * Declares the layer order before any other CSS.
 *
 * Build: the CSS minifier drops the explicit layer order statement and merges it into
 * the first layer blocks. This puts it back in front of every built CSS file,
 * so the order is declared before any layer content.
 *
 * Dev server: the order of the layers is the order of their first appearance. The Vue
 * devtools bring a style block of their own that the SFC layer plugin wraps in
 * `@layer components`, and it is injected before our CSS. Without the statement at the
 * very top of the page, `components` would be declared before `reset` and lose against it.
 */
export const layerOrderFirst = (): Plugin => {
  let serving = false
  return {
    name: 'mindwhile-layer-order-first',
    enforce: 'post',
    configResolved(config) {
      serving = config.command === 'serve'
    },
    transformIndexHtml() {
      if (!serving) return
      return [{ tag: 'style', children: layerOrder, injectTo: 'head-prepend' }]
    },
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'asset' || !file.fileName.endsWith('.css')) continue
        const css = String(file.source)
        if (css.includes(layerOrder)) continue
        file.source = layerOrder + css
      }
    },
  }
}
