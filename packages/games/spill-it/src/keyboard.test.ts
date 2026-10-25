import { describe, expect, it } from 'vitest'
import { colorForKey, type ColorKeyEvent } from './keyboard'

function ev(key: string, extra: Partial<ColorKeyEvent> = {}): ColorKeyEvent {
  return {
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...extra,
  }
}

describe('colorForKey', () => {
  it('maps digits 1 to N to indexes 0 to N-1', () => {
    for (let n = 1; n <= 4; n++) expect(colorForKey(ev(String(n)), 4)).toBe(n - 1)
  })

  it('ignores 0, N+1 and letters', () => {
    expect(colorForKey(ev('0'), 4)).toBeUndefined()
    expect(colorForKey(ev('5'), 4)).toBeUndefined()
    expect(colorForKey(ev('a'), 4)).toBeUndefined()
  })

  it.each(['ctrlKey', 'metaKey', 'altKey', 'shiftKey'] as const)('ignores %s', (mod) => {
    expect(colorForKey(ev('1', { [mod]: true }), 4)).toBeUndefined()
  })

  it('ignores repeated and default-prevented events', () => {
    expect(colorForKey(ev('1', { repeat: true }), 4)).toBeUndefined()
    expect(colorForKey(ev('1', { defaultPrevented: true }), 4)).toBeUndefined()
  })

  it('ignores editable targets', () => {
    for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT']) {
      expect(colorForKey(ev('1', { target: { tagName } }), 4)).toBeUndefined()
    }
    expect(colorForKey(ev('1', { target: { tagName: 'DIV', isContentEditable: true } }), 4)).toBe(
      undefined,
    )
    expect(colorForKey(ev('1', { target: { tagName: 'BUTTON' } }), 4)).toBe(0)
  })
})
