// Profile symbols: fixed shape names -> Lucide components.
// Names are permanent: new shapes may be added at the end, none is renamed or removed.
// The list is a draft until the maintainer has reviewed it.
import {
  Anchor,
  Bell,
  Circle,
  CircleHelp,
  Cloud,
  Crown,
  Diamond,
  Droplet,
  Flag,
  Flame,
  Gem,
  Heart,
  Hexagon,
  Key,
  Leaf,
  Moon,
  Octagon,
  Pentagon,
  Plus,
  Shield,
  Square,
  Star,
  Sun,
  Triangle,
  Zap,
} from '@lucide/vue';

export const profileSymbols = {
  star: Star,
  heart: Heart,
  circle: Circle,
  square: Square,
  triangle: Triangle,
  diamond: Diamond,
  hexagon: Hexagon,
  pentagon: Pentagon,
  octagon: Octagon,
  moon: Moon,
  sun: Sun,
  cloud: Cloud,
  zap: Zap,
  leaf: Leaf,
  flame: Flame,
  droplet: Droplet,
  anchor: Anchor,
  key: Key,
  bell: Bell,
  flag: Flag,
  crown: Crown,
  gem: Gem,
  shield: Shield,
  plus: Plus,
} as const;

export type ProfileSymbolName = keyof typeof profileSymbols;

export const profileSymbolNames = Object.keys(profileSymbols) as readonly ProfileSymbolName[];

// Neutral icon for names this version does not know.
export { CircleHelp as IconSymbolPlaceholder };
