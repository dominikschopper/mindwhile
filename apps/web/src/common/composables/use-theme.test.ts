// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import { useTheme } from './use-theme'

const { setTheme } = useTheme()

describe('useTheme', () => {
  beforeEach(() => {
    setTheme('system')
  })

  it('sets data-theme to light and dark and removes it for system', () => {
    setTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    setTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    setTheme('system')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })
})
