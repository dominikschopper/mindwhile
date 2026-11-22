// The wobble of the selected block, defined as data. A pure function turns one wobble kind and a
// wave count into CSS keyframes (the clip-path polygon of the block and the matching outline
// ring). wobble-style.ts puts the generated CSS on the page. This file is the only place with
// the numbers of the wobble, tune it here.

/** One wobble kind. All fractions are relative to the block width, all heights to its height. */
export type WobbleKind = {
  /** Waves along each wall: a fixed number, or 'layers' for one wave per layer (up to MAX_WAVES). */
  waves: number | 'layers';
  /** How far a wall is pulled in at a wave crest (fraction of the width, clip-path polygon). */
  pinch: number;
  /** How far the block widens when squashed (fraction of the width, scaleX). Must stay below twice the wall air. */
  bulge: number;
  /** Vertical squash and stretch (fraction of the height, scaleY). */
  squash: number;
  /** How far the block hops up when stretched (rem). */
  lift: number;
  /** Duration of one loop (ms). */
  duration: number;
  /** Keyframes per loop, even: squash and stretch alternate and the wave inverts at every one. */
  steps: number;
  /** Amplitude of the second half of the loop, 1 = none, below 1 = the jiggle fades (aftershock). */
  aftershock: number;
  /** Phase shift of the right wall against the left one, in waves (0.5 = they move against each other). */
  wallShift: number;
};

/** Kinds by block size: 1 layer, 2 layers, 3 or more layers. */
export const wobbleKinds = {
  // A quick, springy squash with one wave per wall, strong vertical squash and a hop.
  1: {
    waves: 1,
    pinch: 0.16,
    bulge: 0.14,
    squash: 0.16,
    lift: 0.3,
    duration: 1300,
    steps: 4,
    aftershock: 1,
    wallShift: 0,
  },
  // A slower bend with two waves, the walls ripple against each other.
  2: {
    waves: 2,
    pinch: 0.16,
    bulge: 0.12,
    squash: 0.06,
    lift: 0.225,
    duration: 990,
    steps: 4,
    aftershock: 1,
    wallShift: 0.5,
  },
  // A heavy, slow jiggle, one wave per layer, with a fading aftershock.
  3: {
    waves: 'layers',
    pinch: 0.18,
    bulge: 0.16,
    squash: 0.12,
    lift: 0.2,
    duration: 1430,
    steps: 8,
    aftershock: 0.5,
    wallShift: 0.25,
  },
} as const satisfies Record<number, WobbleKind>;

export type WobbleKindId = keyof typeof wobbleKinds;

/** Upper limit of waves per wall. */
export const MAX_WAVES = 5;

/** Air between layer and glass wall as a fraction of the block width (0.25rem of 2.25rem). */
export const WALL_AIR = 0.25 / 2.25;

/** Thickness of the outline ring (px). */
export const RING_PX = 1;

/** Share of the ripple amplitude in the squashed keyframes (the stretched ones have the full pinch). */
const SQUASH_RIPPLE = 0.5;

/** The kind and the wave count of a block of the given size. */
export function wobbleFor(layerCount: number): { kind: WobbleKindId; waves: number } {
  const size = Math.max(Math.floor(layerCount), 1);
  const kind = Math.min(size, 3) as WobbleKindId;
  return { kind, waves: wavesOf(kind, size) };
}

function wavesOf(kind: WobbleKindId, layerCount: number): number {
  const waves: number | 'layers' = wobbleKinds[kind].waves;
  const wanted = waves === 'layers' ? layerCount : waves;
  return Math.min(Math.max(Math.floor(wanted), 1), MAX_WAVES);
}

/** Every combination that can occur, for the generated style sheet. */
export function wobbleVariants(): { kind: WobbleKindId; waves: number }[] {
  const seen = new Set<string>();
  const variants: { kind: WobbleKindId; waves: number }[] = [];
  for (let size = 1; size <= MAX_WAVES + 1; size++) {
    const variant = wobbleFor(size);
    const key = `${variant.kind}-${variant.waves}`;
    if (!seen.has(key)) {
      seen.add(key);
      variants.push(variant);
    }
  }
  return variants;
}

export type WobbleFrame = {
  /** Position in the loop, 0 to 100. */
  percent: number;
  /** Hop (rem, upwards) added to the block lift. */
  lift: number;
  scaleX: number;
  scaleY: number;
  /** Inset of the left wall per sample point, top to bottom (fraction of the width, 0 or more). */
  left: number[];
  /** Inset of the right wall per sample point, top to bottom. */
  right: number[];
};

/** Sample points per wall. Equal in every keyframe of a variant, more waves need more points. */
export function pointsPerWall(waves: number): number {
  return Math.max(9, waves * 4 + 1);
}

// Shape of the ripple along the wall: zero at the corners, so the corners stay in place.
function envelope(y: number): number {
  return Math.sqrt(Math.sin(Math.PI * y));
}

// Anchored blocks sit on a body that must not move: the deformation fades to zero from the middle
// of the block down to its bottom edge.
function anchorFade(y: number): number {
  return y <= 0.5 ? 1 : 0.5 + 0.5 * Math.cos(Math.PI * (y - 0.5) * 2);
}

function wallOffsets(
  amplitude: number,
  waves: number,
  points: number,
  phase: number,
  anchored: boolean,
): number[] {
  const offsets: number[] = [];
  for (let j = 0; j < points; j++) {
    const y = j / (points - 1);
    const wave = 0.5 - 0.5 * Math.cos(2 * Math.PI * (waves * y + phase));
    const fade = anchored ? anchorFade(y) : 1;
    offsets.push(round(amplitude * envelope(y) * wave * fade));
  }
  return offsets;
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/**
 * The keyframes of one variant as data. The last frame is a copy of the first.
 * An anchored block keeps its bottom edge fixed at the full width: no hop, no bulge, no squash
 * below its normal height (so it never leaves a gap to the body under it), and the wall
 * deformation fades to zero towards the bottom. The numbers of the kind stay the same.
 */
export function wobbleFrames(kindId: WobbleKindId, waves: number, anchored = false): WobbleFrame[] {
  const kind: WobbleKind = wobbleKinds[kindId];
  const count = Math.min(Math.max(Math.floor(waves), 1), MAX_WAVES);
  const points = pointsPerWall(count);
  const frames: WobbleFrame[] = [];
  for (let step = 0; step < kind.steps; step++) {
    const squashed = step % 2 === 0;
    const strength = step < kind.steps / 2 ? 1 : kind.aftershock;
    const amplitude = kind.pinch * strength * (squashed ? SQUASH_RIPPLE : 1);
    // The wave inverts at every keyframe (half a wave), the right wall is shifted against the left.
    const phase = step * 0.5;
    frames.push({
      percent: round((step / kind.steps) * 100),
      lift: squashed || anchored ? 0 : round(kind.lift * strength),
      scaleX: round(squashed && !anchored ? 1 + kind.bulge * strength : 1),
      scaleY: round(
        anchored && squashed ? 1 : 1 + (squashed ? -kind.squash : kind.squash) * strength,
      ),
      left: wallOffsets(amplitude, count, points, phase, anchored),
      right: wallOffsets(amplitude, count, points, phase + kind.wallShift, anchored),
    });
  }
  frames.push({ ...frames[0]!, percent: 100 });
  return frames;
}

function pct(value: number): string {
  return `${round(value)}%`;
}

function transformText(frame: WobbleFrame): string {
  const lift = frame.lift === 0 ? '' : ` - ${frame.lift}rem`;
  return `translateY(calc(var(--block-lift)${lift})) scale(${frame.scaleX}, ${frame.scaleY})`;
}

// The polygon runs clockwise: top left corner, the right wall downwards, the left wall upwards.
function outline(frame: WobbleFrame, ring: boolean): string[] {
  const n = frame.left.length;
  const y = (j: number): string => {
    if (!ring || (j > 0 && j < n - 1)) {
      return pct((j / (n - 1)) * 100);
    }
    return j === 0 ? `${RING_PX}px` : `calc(100% - ${RING_PX}px)`;
  };
  const x = (wall: 'left' | 'right', j: number): string => {
    const offset = frame[wall][j]! * 100;
    if (wall === 'left') {
      return ring ? `calc(${pct(offset)} + ${RING_PX}px)` : pct(offset);
    }
    return ring ? `calc(${pct(100 - offset)} - ${RING_PX}px)` : pct(100 - offset);
  };
  const points: string[] = [`${x('left', 0)} ${y(0)}`];
  for (let j = 0; j < n; j++) {
    points.push(`${x('right', j)} ${y(j)}`);
  }
  for (let j = n - 1; j >= 1; j--) {
    points.push(`${x('left', j)} ${y(j)}`);
  }
  return points;
}

function polygon(frame: WobbleFrame): string {
  return `polygon(${outline(frame, false).join(', ')})`;
}

// A ring is the outer polygon and an inner one, cut out with evenodd. Both loops are closed by
// repeating their first point.
function ringPolygon(frame: WobbleFrame): string {
  const outer = outline(frame, false);
  const inner = outline(frame, true);
  return `polygon(evenodd, ${[...outer, outer[0]!, ...inner, inner[0]!].join(', ')})`;
}

export function wobbleName(kind: WobbleKindId, waves: number, anchored = false): string {
  return `jelly-wobble-${anchored ? 'anchored-' : ''}${kind}-${waves}`;
}

export function ringName(kind: WobbleKindId, waves: number): string {
  return `jelly-ring-${kind}-${waves}`;
}

/** The two @keyframes rules of one variant: the block (transform and clip-path) and its ring. */
export function wobbleKeyframes(kind: WobbleKindId, waves: number): string {
  const frames = wobbleFrames(kind, waves);
  const block = frames
    .map(
      (f) =>
        `  ${pct(f.percent)} {\n    transform: ${transformText(f)};\n    clip-path: ${polygon(f)};\n  }`,
    )
    .join('\n');
  const ring = frames
    .map((f) => `  ${pct(f.percent)} {\n    clip-path: ${ringPolygon(f)};\n  }`)
    .join('\n');
  return `@keyframes ${wobbleName(kind, waves)} {\n${block}\n}\n@keyframes ${ringName(kind, waves)} {\n${ring}\n}\n`;
}

/** The @keyframes rule of one anchored variant (no ring, anchored blocks have no outline). */
export function anchoredKeyframes(kind: WobbleKindId, waves: number): string {
  const block = wobbleFrames(kind, waves, true)
    .map(
      (f) =>
        `  ${pct(f.percent)} {\n    transform: ${transformText(f)};\n    clip-path: ${polygon(f)};\n  }`,
    )
    .join('\n');
  return `@keyframes ${wobbleName(kind, waves, true)} {\n${block}\n}\n`;
}

/**
 * The whole generated style sheet: keyframes and the animation rules of every variant, in the
 * components layer. The names are unique and unscoped, the rules are only added when the user
 * does not ask for reduced motion.
 */
export function wobbleStyleSheet(): string {
  const variants = wobbleVariants();
  const keyframes = variants
    .map((v) => wobbleKeyframes(v.kind, v.waves) + anchoredKeyframes(v.kind, v.waves))
    .join('');
  const rules = variants
    .map((v) => {
      const selector = `.tray-glass__block--wobble-${v.kind}.tray-glass__block--waves-${v.waves}`;
      const timing = `${wobbleKinds[v.kind].duration}ms ease-in-out infinite`;
      return (
        `  ${selector} {\n    animation: ${wobbleName(v.kind, v.waves)} ${timing};\n  }\n` +
        `  ${selector}::after {\n    animation: ${ringName(v.kind, v.waves)} ${timing};\n  }\n` +
        `  .tray-glass__block--anchored${selector} {\n    animation: ${wobbleName(v.kind, v.waves, true)} ${timing};\n  }\n`
      );
    })
    .join('');
  return `@layer components {\n${keyframes}@media (prefers-reduced-motion: no-preference) {\n${rules}}\n}\n`;
}
