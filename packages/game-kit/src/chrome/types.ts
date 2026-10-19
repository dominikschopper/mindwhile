export const chromeSlotNames = [
  'header-left',
  'header-center',
  'header-right',
  'footer-left',
  'footer-center',
  'footer-right',
] as const

export type ChromeSlotName = (typeof chromeSlotNames)[number]
