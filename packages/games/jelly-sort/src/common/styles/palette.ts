// Single source of truth for the jelly colors. tokens.css must carry the same
// hex values (palette.test.ts checks that). Hue and lightness differ together so that
// the colors stay apart for normal vision and for protanopia, deuteranopia and
// tritanopia. Provisional until the browser check.

export const paletteThemes = ['light', 'dark'] as const;
export type PaletteTheme = (typeof paletteThemes)[number];

export interface PaletteEntry {
  readonly color: string;
  readonly mark: string;
}

export const markBlack = '#000000';
export const markWhite = '#ffffff';

// Opacity of the mark icons. tokens.css carries the same number
// (--jelly-mark-opacity, palette.test.ts checks that).
export const markOpacity = 0.7;

export const palette: Record<PaletteTheme, readonly PaletteEntry[]> = {
  light: [
    { color: '#cf8f00', mark: markBlack },
    { color: '#67bceb', mark: markBlack },
    { color: '#008e68', mark: markBlack },
    { color: '#f0e442', mark: markBlack },
    { color: '#00507d', mark: markWhite },
    { color: '#7d3600', mark: markWhite },
    { color: '#c2579b', mark: markBlack },
    { color: '#b4b4b4', mark: markBlack },
  ],
  dark: [
    { color: '#e69f00', mark: markBlack },
    { color: '#89cbf0', mark: markBlack },
    { color: '#009e73', mark: markBlack },
    { color: '#f3e968', mark: markBlack },
    { color: '#0067a0', mark: markWhite },
    { color: '#b04e00', mark: markBlack },
    { color: '#d77cb5', mark: markBlack },
    { color: '#c4c4c4', mark: markBlack },
  ],
};
