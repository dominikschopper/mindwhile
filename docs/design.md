# Design

Status: design direction. Parts marked "to try" are decided to be tried during development and may change. Points under "Open" are undecided. Animation ideas for single games are in `ideas.md`.

## Rules for all design

- All colors come from the tokens in `packages/game-kit/src/styles` (role tokens, light and dark through `light-dark()`), never hard-coded values
- All motion respects `prefers-reduced-motion`. Every animation has a variant without movement or blinking, tested like the existing fill transition of the Spillit cells
- Animate only `transform` and `opacity`

## Buttons

**Built:** `AppButton` in `packages/game-kit/src/buttons` is the shared button for the platform and the games. It has the variants `primary`, `secondary` and `danger`, an optional icon slot and a link form (`as` a router link or `a`). It renders a native `<button>` by default. The footer buttons, the main menu, the notice bar, the abort dialog, the `HowToMore` button, the Go button of the game page and the next button of the result use it.

## Platform start page

### Desktop

```
+------------------------------------------------+
| Header                                         |
|________________________________________________|
|                                                |
|           [Tile] [Tile] [Tile] [Tile]          |
|                                                |
|           [Tile] [Tile] [Tile] [Tile]          |
|                                                |
|                                                |
|                                                |
|                                                |
|________________________________________________|
| Footer                                         |
+------------------------------------------------+
```

The content area with the tiles is centered, at most 960px wide.

### Mobile

Same design and same CSS. The tiles simply wrap where there is room: three columns on a tablet, two or one on a phone, fully fluid.

```
+--------------------------+
| Header                   |
|__________________________|
|                          |
|     [Tile] [Tile]        |
|                          |
|     [Tile] [Tile]        |
|                          |
|     [Tile] [Tile]        |
|                          |
|     [Tile] [Tile]        |
|                          |
|                          |
|                          |
|__________________________|
| Footer                   |
+--------------------------+
```

### Tile

Every tile contains

```
+------+
| Icon |
| Name |
+------+
```

The name has a pill at the bottom left and one at the bottom right: the left one holds the last played level, the right one the best score.

```
     T h e N a m e
(Level:c)        (521)
```

Both pills always use the same color scheme, each with its own: level green background, score red background.

**Ownership:** the tile component lives in the platform (link, size, focus, grid, pills). The game does not bring a component, it provides the data that fills the tile: `symbol` and the primary color in the manifest, name and score display in its texts (see `game-contract.md`). So every tile looks and behaves the same, and nothing of the game is loaded for the start page.

**Built:** `GameTile.vue` in `apps/web/src/game-selection`. The tile is a link to the game page with the game color on icon, border and a light fill. The level pill sits bottom left (green), the score pill bottom right (red). Without a result both pills are hidden and only the text "No result yet" remains for screen readers. The level pill shows the highest level with a result until the profile exists. The grid is fluid (`auto-fill`, at least 10rem per tile).

**To try:** position (bottom or top of the tile) and colors of the pills are not fixed. The current built version is a first try. Position and colors may change after the look is checked in the browser (earlier idea: both pills at the top, light yellow background with dark text).

## Alerts and popups

- All alerts and popups are `<dialog>` elements and normally have a backdrop, semi-transparent or opaque
- With `prefers-reduced-motion` the backdrop is dark and semi-transparent or opaque
- **Built:** `AppDialog` in `packages/game-kit/src/dialog` is the shared `<dialog>`: heading, content and actions slots, prop `backdrop` with `'rainbow'` (default) or `'opaque'`. `AbortDialog` is built on it
- **Built:** the rainbow is a `linear-gradient` on the backdrop with a hue shift (`filter: hue-rotate`). It runs about 8 seconds (two rounds of 4 seconds) and then stops, so it does not drain the battery. With `prefers-reduced-motion` it is off and the backdrop is dark and semi-transparent
- **To try:** the look and the speed of the rainbow. The first version is built, but it is not yet confirmed in the browser
- The opaque variant is always opaque. The pause screen (`PauseCover`, not built yet) works the same way, with one exception: it has to hide the board so nobody can plan during the pause, so its backdrop is always opaque
- The content of a dialog has its own opaque surface, so its text stays readable on the rainbow in light and dark

## Games

Every game has a primary color, part of the data the game provides for its tile (manifest field `color`, a name from `gameColors` in `core`: `blue`, `green`, `orange`, `red` or `yellow`). `game-kit` resolves the name: one class per name (`.game-color-<name>`) sets `--game-color` and `--on-game-color` with `light-dark()`, and the helpers `.text-game`, `.bg-game` and `.border-game` refer to them. A game cannot pick another color, and never a hex value. The platform knows it before any game code is loaded.

**Built:** `gameColors` in `core`, the manifest field `color` (Spillit is `orange`), the classes in `packages/game-kit/src/styles/game-colors.css`. The start page tile and the highlight of the `LevelPicker` use the color. The helpers `.text-game`, `.bg-game` and `.border-game` exist, but no component uses them yet. Headings and highlights of a game are meant to use them when they are needed.

### Level selection

The level selection is a shared component `LevelPicker` in `game-kit`, used by the platform on the game page. It replaces the plain dropdown and is meant to be more interesting than that, with animation. **Built:** `packages/game-kit/src/level-picker`, used on the game page (`apps/web/src/game/GameView.vue`).

- **A real selection underneath:** the picker is a radio group (visually hidden `<input type="radio">`), so keyboard (arrow keys), screen readers and focus work without extra code. The look is only styling
- **Slot per step:** the picker owns selection, focus and animation, the game fills what stands on a step through a slot. The platform supplies the level label and the best result of the level. Spillit fills the step with its optional `LevelPreview` (a small grid per level: 6×6, 10×10, 14×14) instead of only a text
- **Look for few levels (Spillit):** a staircase of stacked slabs, `a` at the bottom, `c` at the top. No scrolling, three steps fit on one screen. The selected level lifts off (shift, shadow, the game color). The highlight is one slab that slides to the new step, so the old one sinks back. With `prefers-reduced-motion` the highlight jumps without a transition

```
-------------------+
   -------------   |
  /__Level:_c__/|  |
  |____________|   |
  /__Level:_b__/|  |
  |____________|   |
  /__Level:_a__/|  |
  |____________|   |
-------------------+
```

- **Many levels:** a game with many levels would switch the same component into a scrollable mode (up and down the stairs, or a path where the next level is visible) without changing its API. Not built until a game needs it
- **No locks for now:** all levels are freely selectable. A level with different rules is just another level with its own ID. A rule for locked levels (a level only available after another) is not built on stock. It would need profile and storage, and the platform would have to enforce it on the route as well, so a direct URL cannot bypass it. A game may later bring its own level selection if it needs one (see `game-contract.md`)

## Open

- **Last played level:** the pill on the tile needs storage that does not exist yet (the best results only give the highest level with a result). It is decided together with the profile. Until then the pill shows the highest level with a result
