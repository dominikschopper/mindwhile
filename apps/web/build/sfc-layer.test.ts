import postcss from 'postcss'
import { describe, expect, it } from 'vitest'
import { sfcLayer } from './sfc-layer'

const sfcFrom = '/src/Foo.vue?vue&type=style&index=0&scoped=abc&lang.css'

async function run(css: string, from: string): Promise<string> {
  const result = await postcss([sfcLayer]).process(css, { from })
  return result.css
}

describe('sfcLayer', () => {
  it('wraps a scoped SFC style block in @layer components', async () => {
    const css = await run('.x[data-v-abc] { color: red; }', sfcFrom)
    expect(css.replace(/\s+/g, '')).toBe('@layercomponents{.x[data-v-abc]{color:red;}}')
  })

  it('leaves a plain css file untouched', async () => {
    const input = '.x { color: red; }'
    expect(await run(input, '/src/styles/base.css')).toBe(input)
  })

  it('does not wrap a block that already has @layer components', async () => {
    const input = '@layer components { .x { color: red; } }'
    const css = await run(input, sfcFrom)
    expect(css).toBe(input)
    expect(css.match(/@layer/g)).toHaveLength(1)
  })

  it('keeps @charset and @import at the root', async () => {
    const css = await run('@charset "utf-8";\n@import "./a.css";\n.x { color: red; }', sfcFrom)
    expect(css.indexOf('@layer')).toBeGreaterThan(css.indexOf('@import'))
    expect(css.indexOf('@layer')).toBeGreaterThan(css.indexOf('@charset'))
    const layerBody = css.slice(css.indexOf('@layer'))
    expect(layerBody).not.toContain('@import')
    expect(layerBody).not.toContain('@charset')
    expect(layerBody).toContain('.x')
  })
})
