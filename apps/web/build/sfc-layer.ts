import type { Plugin } from 'postcss'

const sfcStyleBlock = /\.vue\?.*type=style/

/**
 * Wraps the content of every Vue SFC style block in `@layer components`,
 * so unlayered SFC styles cannot beat the `utilities` layer.
 */
export const sfcLayer: Plugin = {
  postcssPlugin: 'mindwhile-sfc-layer',
  Once(root, { AtRule, result }) {
    const from = result.opts.from
    if (!from || !sfcStyleBlock.test(from)) return

    const alreadyLayered = root.nodes.some(
      (node) => node.type === 'atrule' && node.name === 'layer' && node.nodes !== undefined,
    )
    if (alreadyLayered) return

    const moved = root.nodes.filter(
      (node) => !(node.type === 'atrule' && (node.name === 'charset' || node.name === 'import')),
    )
    if (moved.length === 0) return

    const layer = new AtRule({ name: 'layer', params: 'components' })
    moved.forEach((node) => layer.append(node))
    root.append(layer)
  },
}
