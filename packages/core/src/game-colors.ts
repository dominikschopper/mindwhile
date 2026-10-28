export const gameColors = ['blue', 'green', 'orange', 'red', 'yellow'] as const

export type GameColor = (typeof gameColors)[number]
