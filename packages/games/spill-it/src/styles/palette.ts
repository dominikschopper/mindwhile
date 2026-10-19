// Single source of truth for the cell colors. tokens.css must carry the same
// hex values (palette.test.ts checks that). Based on the Okabe-Ito set
// (orange, sky blue, bluish green, yellow, blue, vermillion), adjusted per
// theme so that all pairs stay apart for normal vision and for protanopia,
// deuteranopia and tritanopia. Provisional until the browser check.

export const paletteThemes = ['light', 'dark'] as const
export type PaletteTheme = (typeof paletteThemes)[number]

export interface PaletteEntry {
  readonly color: string
  readonly mark: string
}

export const markBlack = '#000000'
export const markWhite = '#ffffff'

export const palette: Record<PaletteTheme, readonly PaletteEntry[]> = {
  light: [
    { color: '#cf8f00', mark: markBlack },
    { color: '#67bceb', mark: markBlack },
    { color: '#008e68', mark: markBlack },
    { color: '#f0e442', mark: markBlack },
    { color: '#00507d', mark: markWhite },
    { color: '#954200', mark: markWhite },
  ],
  dark: [
    { color: '#e69f00', mark: markBlack },
    { color: '#89cbf0', mark: markBlack },
    { color: '#009e73', mark: markBlack },
    { color: '#f3e968', mark: markBlack },
    { color: '#0067a0', mark: markWhite },
    { color: '#c05500', mark: markBlack },
  ],
}
