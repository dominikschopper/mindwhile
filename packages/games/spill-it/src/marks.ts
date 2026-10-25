import {
  IconActivity,
  IconApple,
  IconCircleAlert,
  IconInfinity,
  IconPlane,
  IconSunMoon,
} from '@mindwhile/game-kit'

// Mark per color index, in the order defined in docs/game-spill-it.md.
// Presentation only, not part of the scoring. The name is a texts key for screen readers.
export const marks = [
  { id: 'infinity', icon: IconInfinity, nameKey: 'mark.0' },
  { id: 'alert', icon: IconCircleAlert, nameKey: 'mark.1' },
  { id: 'pulse', icon: IconActivity, nameKey: 'mark.2' },
  { id: 'plane', icon: IconPlane, nameKey: 'mark.3' },
  { id: 'sun-moon', icon: IconSunMoon, nameKey: 'mark.4' },
  { id: 'apple', icon: IconApple, nameKey: 'mark.5' },
] as const

export type Mark = (typeof marks)[number]
export type MarkId = Mark['id']
