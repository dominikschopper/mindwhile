# Game concept: Jelly Sort (game ID `jelly-sort`)

Status: draft, implemented in `packages/games/jelly-sort`. Jelly Sort is the second game of the platform, a sorting and planning game in the style of "water sort". Platform rules, formats and versioning live in `architecture.md`, the interface in `game-contract.md`, terms in `glossary.md`. The game ID in code is `jelly-sort`, the package is `@mindwhile/game-jelly-sort`.

Display name: "Jelly Sort" (`game.name` in `common/texts/en.ts`). The ID stays `jelly-sort` once results exist, the display name is only a text and can change later.

## Basic rule

- The board is a set of trays, drawn as open lab glasses (shape `|_|`: straight sides, flat bottom, open top). Each tray holds up to `capacity` layers, stacked from the bottom, each layer is one jelly in one color
- A pour moves the whole top block of one tray (all contiguous layers of the top color) onto another tray
- Goal: every non-empty tray is full and holds a single color

## Decisions

- **Pour rule.** Only the whole top block of a tray can be poured, and only if all of it fits. The target must be empty or have the same top color, and must have enough free room. Pouring onto the same tray, from an empty tray or onto another color is not allowed
- **Pointless pour.** Pouring a tray that holds a single color into an empty tray changes nothing and is not a move: it is ignored and not counted (like Spillit ignores the color the region already has)
- **Layers and goal.** Classic: every layer is one unit high, and every color has exactly as many layers as a tray holds (its capacity). Won = every non-empty tray is full and holds one color. There is no move limit
- **Dead end gives `lost`.** If no valid pour exists and the board is not solved, the round ends as `lost` with the neutral score `[0, 0]`. The platform creates no result and no best result for it and shows a neutral lost panel (see `architecture.md`). The lost panel lies over the board with the same rainbow backdrop as the platform dialogs. Only "no valid move at all" is detected, a position that still has pours but can no longer be solved is not (accepted, the player can abort)
- **No undo, no restart.** A pour is final
- **Par: the generator solution, an upper bound.** The board is made by playing legal reverse pours from the solved state. The number of those reverse moves is the par, played forward in reverse order they solve the board. The par is not the optimum, so the deviation can be negative (and good players will often beat it). The method belongs to the scoring version: if it changes, the scoring version goes up and old results stay separate
- **Scoring:** two values, `[points, deviation]`, like Spillit. Points: `floor(basePoints * par / moves / 10) * 10`, integer arithmetic only, higher is better; a round on par gives the base value of the level, fewer moves give more, more moves fewer, never negative. The deviation (moves minus par, fewer is better) is the second value and breaks ties. Base points per level: `a` 500, `b` 750, `c` 1000 (starting values until the first release, part of the scoring version). The score positions are `points` (`higher`) and `deviation` (`lower`) in the manifest. Texts: "{points} points · On par / {n} moves faster / {n} moves slower"
- **Levels: three.** IDs `a`, `b`, `c` (see `glossary.md`). The numbers live only in `src/common/levels/levels.ts`:

  | Level | Name | Colors | Capacity | Empty trays | Trays | Minimum par | Base points |
  |---|---|---|---|---|---|---|---|
  | `a` | 4 colors | 4 | 4 | 2 | 6 | 10 | 500 |
  | `b` | 6 colors | 6 | 4 | 2 | 8 | 16 | 750 |
  | `c` | 8 colors | 8 | 5 | 2 | 10 | 22 | 1000 |

  All numbers are starting values until the first release (`scoringVersion` is 0, it becomes 1 with the first release, after that every change raises it). Harder levels are planned for later: the current levels rarely end in a dead end because of the two empty trays
- **Generator: reverse pours from the solved board.** Mulberry32 from `core` through `createRng` (no `Math.random()`). Color `i` fills tray `i` in the solved board, followed by the empty trays. Each step collects all legal reverse pours (the exact inverses of legal forward pours: the forward source held its whole top block, the forward target was empty or had the same top color, no pointless pour) and picks one with the stream; a step that directly undoes the previous one is excluded. A draw runs until the minimum par is reached. A draw that gets stuck earlier, ends solved or has no forward move is discarded and the next draw continues the same stream (never reseeding). After 1000 draws without an accepted board `createRound` throws. The minimum par was measured over 5000 seeds per level (a walk of `n` reverse pours only splits blocks of two or more layers, so it often dead ends before `n`; the numbers are chosen so that the draw count stays small). Generator and minimum par belong to the scoring version
- **Seed: random per round, no repetition.** Every new round has a new board (`newSeed()` from `core`), best results build up over many boards, comparable through the ratio to par. Same seed gives the same board on every device
- **No time and no pause.** The score is moves only. The game uses neither the clock nor `usePause` and fills no chrome slot
- **Round behavior.** A move is `{ type: 'pour', from, to }` with tray indices (0-based). Invalid data throws. A pour that is not allowed or pointless, and any move after the round end, is ignored and not counted. `serialize()` returns `{ moves }` (the counted pours as `[from, to]`), board and counter are replayed from the seed and the moves on restore. `result()` returns `won` with `[points, moves - par]`, `lost` with `[0, 0]` when there is no valid pour and the board is not solved, otherwise `null`
- **Display during the round:** the counter "Moves 7" and "Par 20" are visible from the start. That the par can be beaten is explained in the rules on the game page
- **Level preview:** a small text-free preview of the trays in two rows of equal length (6 trays = 3 + 3, 8 = 4 + 4, 10 = 5 + 5) in a fixed pattern, the same on every render
- **How-to-play page:** headings for the move, the goal and the score. The move section shows a looping demo with three trays (a pause, the pick of the top block, the pour with merge, then again), the goal section shows a static winning state

## Input and keyboard

- Tap a source tray, then a target tray. Tapping the same tray again cancels the selection. Tapping an empty tray as source does nothing. If the target is not valid, the block stays selected (nothing counted) and the screen reader is told. No drag and drop
- Keyboard: arrow keys move the cursor between trays (wrapping around), the number keys `1` to `9` jump to a tray, Enter or Space confirms a source or target (not while a button has focus, the button handles it itself). Modifier keys, key repeat, form fields and events that were already handled are ignored. The keys live in `src/play/keyboard.ts` as pure functions
- Accessibility: every tray is a labelled button ("Tray 3, 2 of 4 filled: red apple, ..." with color and mark of every layer from bottom to top), the board is a labelled group, a live region announces selection, cancel, invalid pour, pour with the move count, win and loss. Tap targets are at least 44 px. Marks always come with the colors

## Marks and colors

- Marks are Lucide icons from `game-kit`, in this order: `infinity`, `circle-alert`, `activity`, `plane`, `sun-moon`, `apple`, `paw-print`, `film` (eight, level `c` uses all of them, `square-x` stays in reserve). Screen reader names: "infinity", "alert", "pulse", "plane", "sun and moon", "apple", "paw print", "film". Marks belong to the presentation, not to the scoring
- The colors live only in `src/common/styles/tokens.css` (`--jelly-0` to `--jelly-7`, with a mark color per jelly, `--jelly-mark-opacity` and the corner radius `--jelly-radius`), light and dark through `light-dark()`. There is no palette test and no contrast measurement: the look is judged by the maintainer and in user tests
- Color names for screen readers: orange, sky blue, green, yellow, dark blue, red, pink, gray
- Known small open point: jelly 5 is brown in the light theme and red in the dark theme, but its screen reader name is "red" in both

## Look and animation

- **Shapes:** jellies are near-square cubes with a small corner radius (`--jelly-radius`). A glass is a bit wider than a layer, with a 5 px wall (`--glass-wall`) and a little air between layer and wall. Layers fill from the bottom, a tray is as high as its capacity
- **Layout:** trays stand in rows of equal length, centered. 6 trays are 3 + 3, 8 are 4 + 4, 10 are 5 + 5; an uneven count differs by one, the longer row first. If all trays fit into the width they stand in one row, otherwise in the fewest rows that fit (`src/play/tray-columns.ts`, measured with a resize observer)
- **Selection:** the selected top block (all contiguous layers of the top color) is one unit: it lifts slightly and has a thin soft outline around the whole stack
- **Wobble:** while a block is selected it wobbles until the target is tapped or the selection is cancelled; nothing wobbles while nothing is selected. The wobble deforms in place: the side walls pinch and bulge, the block squashes and stretches, it never rotates and never leaves the glass. There are three kinds chosen by block size: 1 layer (quick, springy squash with a hop), 2 layers (slower bend, the walls ripple against each other), 3 or more layers (heavy, slow jiggle with a fading aftershock). The wave count is one per layer, up to 5. The numbers of the kinds are data in `src/play/wobble.ts`, which generates the keyframes (a `clip-path` polygon and a matching ring for the outline) and injects them as a style sheet at runtime (`wobble-style.ts`). Only the selected block animates, with `transform` and `clip-path`
- **Landing:** state changes immediately and input is never blocked, the animation only follows. On a pour the poured block flows from the source tray to the target tray. If it lands on the same color it goes through three phases: flow (420 ms), hover (600 ms; the poured block wobbles with its own kind and the upper half of the top layer of the target wobbles) and merge into one continuous layer (100 ms). Landing on an empty tray is flow only. The timings are `LANDING_TIMING` in `src/play/animation.ts` and the matching CSS variables in `TrayGlass.css`, both must stay in step
- **Reduced motion:** wobble and landing are off, the selection stays visible through the non-motion cue (lifted and outlined block)
- No SVG gooey filter, no animation library, CSS only

## Scoring tests

- Mandatory per level, `src/scoring/scoring.<level>.test.ts`, checked by `checks/scoring-tests.test.ts`. Ten pinned seeds per level. Every case checks the generated board as text (one group of layers per tray, bottom to top), the par, the pinned solution replayed through the round (won with the expected score and deviation 0), a wander sequence (always the first legal pour from the last tray) with its expected result, and the shortest sequence found by search with its expected result. In addition: a sequence shorter than par gives a negative deviation, a pointless pour is not counted, a dead end gives `lost` with `[0, 0]`
- If generator, par, formula or level numbers change, the tests fail and force a new scoring version
- Testing note: only logic is tested (board, generator, round, scoring per level, keyboard, column layout, timers). Look and feel (colors, wobble, landing, layout) are judged in the browser

## Ideas for later (not decided)

- Harder levels (the current ones rarely end in a dead end because of two empty trays, for example one empty tray, more colors, twists such as blocked trays)
- Hints
- Show the par solution after the round as a replay
- Undo or restart (needs a rule whether it counts)
- Same board again, shareable seed codes, daily and group boards
- Vibration and sound (off by default)

## Open

- **Name:** the trademark register check for "Jelly Sort" is still open (the app store check is done: Jelly Hop and Jelly Cat Sort exist but are different games). If the name changes, only the display text changes, the ID `jelly-sort` stays
- **Unwinnable positions with moves left** are not detected as `lost`, to be watched in play tests
- **Level numbers and minimum par** are starting values until the first release
- **Jelly 5** is brown in light and red in dark, its screen reader name is "red" (see Marks and colors)
