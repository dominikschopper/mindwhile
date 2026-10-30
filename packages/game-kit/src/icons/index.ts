// Lucide icons under our own names. Named imports only, so unused icons are tree-shaken.
// Lucide icons render an svg that is aria-hidden unless an aria-label is passed.
import {
  Activity as IconActivity,
  Apple as IconApple,
  ArrowLeft as IconBack,
  Check as IconCheck,
  ChevronDown as IconChevronDown,
  CircleAlert as IconCircleAlert,
  Film as IconFilm,
  Grid2x2 as IconGrid2x2,
  Infinity as IconInfinity,
  Languages as IconLanguages,
  Menu as IconMenu,
  Pause as IconPause,
  PawPrint as IconPawPrint,
  Puzzle as IconPuzzle,
  Plane as IconPlane,
  Play as IconPlay,
  Settings as IconSettings,
  SquareX as IconSquareX,
  SunMoon as IconSunMoon,
  UserStar as IconUserStar,
  X as IconClose,
} from '@lucide/vue'

export {
  IconActivity,
  IconApple,
  IconBack,
  IconCheck,
  IconChevronDown,
  IconCircleAlert,
  IconClose,
  IconFilm,
  IconGrid2x2,
  IconInfinity,
  IconLanguages,
  IconMenu,
  IconPause,
  IconPawPrint,
  IconPlane,
  IconPlay,
  IconPuzzle,
  IconSettings,
  IconSquareX,
  IconSunMoon,
  IconUserStar,
}

// Game symbols: icon name used in manifests -> component (platform resolves manifest.symbol).
export const gameSymbols = {
  'grid-2x2': IconGrid2x2,
} as const

export type GameSymbol = keyof typeof gameSymbols
