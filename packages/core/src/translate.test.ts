import { describe, expect, expectTypeOf, it } from 'vitest'
import { createT } from './translate'

const t = createT({
  title: 'Spillit',
  greet: 'Hello {name}',
  range: '{from} to {to}',
  twice: '{x} and {x}',
  moves: { one: '{count} move', other: '{count} moves' },
  items: { zero: 'No items', one: '{count} item', other: '{count} items' },
  owned: { one: '{who} has {count} card', other: '{who} has {count} cards' },
})

describe('createT', () => {
  it('returns plain text', () => {
    expect(t('title')).toBe('Spillit')
  })

  it('inserts one and several parameters', () => {
    expect(t('greet', { name: 'Ada' })).toBe('Hello Ada')
    expect(t('range', { from: 1, to: 5 })).toBe('1 to 5')
  })

  it('replaces a placeholder used twice', () => {
    expect(t('twice', { x: 'a' })).toBe('a and a')
  })

  it('selects plural one and other', () => {
    expect(t('moves', { count: 1 })).toBe('1 move')
    expect(t('moves', { count: 2 })).toBe('2 moves')
    expect(t('moves', { count: 0 })).toBe('0 moves')
  })

  it('uses the zero form when present', () => {
    expect(t('items', { count: 0 })).toBe('No items')
    expect(t('items', { count: 1 })).toBe('1 item')
  })

  it('supports further placeholders in plurals', () => {
    expect(t('owned', { who: 'Bo', count: 2 })).toBe('Bo has 2 cards')
  })
})

describe('createT types', () => {
  it('derives keys and parameters', () => {
    expectTypeOf(t)
      .parameter(0)
      .toEqualTypeOf<'title' | 'greet' | 'range' | 'twice' | 'moves' | 'items' | 'owned'>()
    expectTypeOf(t('title')).toBeString()
    expectTypeOf(t('moves', { count: 1 })).toBeString()
  })

  it('rejects wrong calls', () => {
    // @ts-expect-error unknown key
    t('nope')
    // @ts-expect-error missing parameter
    t('range', { from: 1 })
    // @ts-expect-error missing parameters argument
    t('greet')
    // @ts-expect-error extra parameter
    t('greet', { name: 'Ada', other: 1 })
    // @ts-expect-error parameter on a key without placeholders
    t('title', { name: 'Ada' })
    // @ts-expect-error plural needs count
    t('moves', {})
  })
})
