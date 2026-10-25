export type ColorKeyEvent = {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
  repeat?: boolean
  defaultPrevented?: boolean
  target?: unknown
}

type TargetLike = { tagName?: unknown; isContentEditable?: unknown }

function isEditable(target: unknown): boolean {
  if (typeof target !== 'object' || target === null) return false
  const { tagName, isContentEditable } = target as TargetLike
  if (isContentEditable === true) return true
  if (typeof tagName !== 'string') return false
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName.toUpperCase())
}

/** Color index (0-based) a key press picks, or undefined when the event must be ignored. */
export function colorForKey(event: ColorKeyEvent, colorCount: number): number | undefined {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return undefined
  if (event.repeat || event.defaultPrevented) return undefined
  if (isEditable(event.target)) return undefined
  if (!/^[1-9]$/.test(event.key)) return undefined
  const color = Number(event.key) - 1
  return color < colorCount ? color : undefined
}
