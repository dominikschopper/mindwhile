// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { dismissNotice, notice, showNotice } from './use-notice'

describe('use-notice', () => {
  afterEach(() => {
    dismissNotice()
  })

  it('has no notice by default', () => {
    expect(notice.value).toBeNull()
  })

  it('shows a notice and dismisses it', () => {
    showNotice('Something went wrong')
    expect(notice.value).toBe('Something went wrong')
    dismissNotice()
    expect(notice.value).toBeNull()
  })

  it('replaces an older notice with a newer one', () => {
    showNotice('first')
    showNotice('second')
    expect(notice.value).toBe('second')
  })
})
