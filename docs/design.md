# Design

Status: design direction. Parts marked "to try" are decided to be tried during development and may change. Points under "Open" are undecided. Animation ideas for single games are in `ideas.md`.

## Rules for all design

- All colors come from the tokens in `packages/game-kit/src/styles` (role tokens, light and dark through `light-dark()`), never hard-coded values
- All motion respects `prefers-reduced-motion`. Every animation has a variant without movement or blinking, tested like the existing fill transition of the Spillit cells
- Animate only `transform` and `opacity`

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

**To try:** position (bottom or top of the tile) and colors of the pills are not fixed. They are decided by trying them while the start page is built (earlier idea: both pills at the top, light yellow background with dark text).

## Alerts and popups

- All alerts and popups are `<dialog>` elements and normally have a backdrop, semi-transparent or opaque
- With `prefers-reduced-motion` the backdrop is dark and semi-transparent or opaque
- **To try:** without reduced motion, a nicely changing, animated CSS rainbow as the backdrop. The CSS lives in `game-kit` and is shared
- The pause screen (`PauseCover`) works the same way, with one exception: it has to hide the board so nobody can plan during the pause, so its backdrop is always opaque
- The content of a dialog has its own opaque surface, so its text stays readable on the rainbow in light and dark
- The animation must be cheap (a hue shift in CSS) or stop after a few seconds, so a long pause does not drain the battery

## Games

Every game has a primary color, part of the data the game provides for its tile (manifest field `color`, the name of a palette token, never a hex value, so light and dark come from the token). H1/H2 headings and highlights of the game use it. The platform knows it before any game code is loaded.

### Level selection

The level selection is a shared component `LevelPicker` in `game-kit`, used by the platform on the game page. It replaces the plain dropdown and is meant to be more interesting than that, with animation.

- **A real selection underneath:** the picker is a radio group (visually hidden `<input type="radio">`), so keyboard (arrow keys), screen readers and focus work without extra code. The look is only styling
- **Slot per step:** the picker owns selection, focus and animation, the game fills what stands on a step through a slot. Spillit can show a small preview of the board per level (6×6, 10×10, 14×14 as a tiny grid) instead of only the text "6×6 · 4 colors"
- **Look for few levels (Spillit):** a staircase of stacked slabs, `a` at the bottom, `c` at the top. No scrolling, three steps fit on one screen. The selected level lifts off (shift, shadow, primary color). On a change the highlight slides to the new step and the old one sinks back

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
