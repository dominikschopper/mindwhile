// Mark per color index, in the order defined in docs/game-spill-it.md.
// Presentation only, not part of the scoring.
export const marks = ['x', '*', 'o', '-', '#', '|'] as const

export type Mark = (typeof marks)[number]
