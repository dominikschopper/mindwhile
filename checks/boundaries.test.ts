import { join } from 'node:path'
import { ESLint } from 'eslint'
import { describe, expect, it, vi } from 'vitest'

// Guards the lint configuration itself. A boundary rule that silently stops working
// (resolver, plugin upgrade, changed option) would keep `pnpm lint` green.
// The first lint run loads the whole config and the type-aware parser, which is slow.
vi.setConfig({ testTimeout: 60_000 })

const root = join(import.meta.dirname, '..')
const eslint = new ESLint({ cwd: root })

async function messagesFor(filePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: join(root, filePath) })
  return (result?.messages ?? []).map((message) => message.ruleId ?? 'parse-error')
}

describe('boundary rules', () => {
  it('forbids a game importing the web app', async () => {
    const rules = await messagesFor(
      'packages/games/spill-it/src/tmp.ts',
      "import { router } from '../../../../apps/web/src/router'\nexport const x = router\n",
    )
    expect(rules).toContain('boundaries/dependencies')
  })

  it('forbids core importing vue', async () => {
    const rules = await messagesFor(
      'packages/core/src/tmp.ts',
      "import { ref } from 'vue'\nexport const x = ref\n",
    )
    expect(rules).toContain('boundaries/dependencies')
  })

  it('forbids game-kit importing a game', async () => {
    const rules = await messagesFor(
      'packages/game-kit/src/tmp.ts',
      "import { manifest } from '../../games/spill-it/src/manifest'\nexport const x = manifest\n",
    )
    expect(rules).toContain('boundaries/dependencies')
  })

  it('forbids common code importing a feature', async () => {
    const rules = await messagesFor(
      'apps/web/src/common/components/tmp.ts',
      "import View from '../../game-selection/GameSelectionView.vue'\nexport const x = View\n",
    )
    expect(rules).toContain('boundaries/dependencies')
  })

  it('forbids a feature importing another feature', async () => {
    const rules = await messagesFor(
      'apps/web/src/play/tmp.ts',
      "import View from '../game-selection/GameSelectionView.vue'\nexport const x = View\n",
    )
    expect(rules).toContain('boundaries/dependencies')
  })

  it('forbids Math.random in a game', async () => {
    const rules = await messagesFor(
      'packages/games/spill-it/src/tmp.ts',
      'export const x = Math.random()\n',
    )
    expect(rules).toContain('no-restricted-properties')
  })

  it.each(['packages/core/src/tmp.ts', 'packages/game-kit/src/tmp.ts', 'apps/web/src/tmp.ts'])(
    'forbids Math.random in %s',
    async (filePath) => {
      const rules = await messagesFor(filePath, 'export const x = Math.random()\n')
      expect(rules).toContain('no-restricted-properties')
    },
  )

  it('allows a game importing core', async () => {
    const rules = await messagesFor(
      'packages/games/spill-it/src/tmp.ts',
      "import { coreName } from '../../../core/src/index'\nexport const x = coreName\n",
    )
    expect(rules).toEqual([])
  })
})
