// Lucide icons under our own names. Named imports only, so unused icons are tree-shaken.
// Lucide icons render an svg that is aria-hidden unless an aria-label is passed.
import {
  Activity as IconActivity,
  Apple as IconApple,
  ArrowLeft as IconBack,
  ArrowRight as IconArrowRight,
  Check as IconCheck,
  ChevronDown as IconChevronDown,
  CircleAlert as IconCircleAlert,
  CircleCheck as IconCircleCheck,
  Download as IconDownload,
  Film as IconFilm,
  FlaskConical as IconFlaskConical,
  Grid2x2 as IconGrid2x2,
  Info as IconInfo,
  Infinity as IconInfinity,
  Languages as IconLanguages,
  Menu as IconMenu,
  OctagonAlert as IconOctagonAlert,
  Pause as IconPause,
  PawPrint as IconPawPrint,
  Puzzle as IconPuzzle,
  Plane as IconPlane,
  Play as IconPlay,
  Settings as IconSettings,
  SquareX as IconSquareX,
  SunMoon as IconSunMoon,
  TriangleAlert as IconTriangleAlert,
  Upload as IconUpload,
  UserStar as IconUserStar,
  X as IconClose,
} from '@lucide/vue';

export {
  IconActivity,
  IconApple,
  IconArrowRight,
  IconBack,
  IconCheck,
  IconChevronDown,
  IconCircleAlert,
  IconCircleCheck,
  IconClose,
  IconDownload,
  IconFilm,
  IconFlaskConical,
  IconGrid2x2,
  IconInfinity,
  IconInfo,
  IconLanguages,
  IconMenu,
  IconOctagonAlert,
  IconPause,
  IconPawPrint,
  IconPlane,
  IconPlay,
  IconPuzzle,
  IconSettings,
  IconSquareX,
  IconSunMoon,
  IconTriangleAlert,
  IconUpload,
  IconUserStar,
};

// Game symbols: icon name used in manifests -> component (platform resolves manifest.symbol).
export const gameSymbols = {
  'flask-conical': IconFlaskConical,
  'grid-2x2': IconGrid2x2,
} as const;

export type GameSymbol = keyof typeof gameSymbols;

export {
  profileSymbols,
  profileSymbolNames,
  IconSymbolPlaceholder,
  type ProfileSymbolName,
} from './profile-symbols';
