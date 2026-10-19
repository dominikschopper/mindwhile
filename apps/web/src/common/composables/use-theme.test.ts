// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import { useTheme } from './use-theme'

const { choice, cycle, setTheme } = useTheme()

describe('useTheme', () => {
  beforeEach(() => {
    setTheme('system')
  })

  it('cycles system, light, dark, system', () => {
    expect(choice.value).toBe('system')
    cycle()
    expect(choice.value).toBe('light')
    cycle()
    expect(choice.value).toBe('dark')
    cycle()
    expect(choice.value).toBe('system')
  })

  it('sets data-theme to light and dark and removes it for system', () => {
    setTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    setTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    setTheme('system')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('writes data-theme when cycling', () => {
    cycle()
    expect(document.documentElement.dataset.theme).toBe('light')
    cycle()
    expect(document.documentElement.dataset.theme).toBe('dark')
    cycle()
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })
})
