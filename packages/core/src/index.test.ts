import { expect, it } from 'vitest'
import { coreName } from './index'

it('exports the package name', () => {
  expect(coreName).toBe('core')
})
