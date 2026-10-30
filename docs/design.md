# Design

Status: design direction. Parts marked "to try" are decided to be tried during development and may change. Points under "Open" are undecided. Animation ideas for single games are in `ideas.md`.

**Colors from screens:** the palette and the role colors were sampled from the design screens (by eye and by script). They are estimates and may be fine-tuned in the browser later.

## Rules for all design

- All colors come from the tokens in `packages/game-kit/src/styles` (role tokens, light and dark through `light-dark()`), never hard-coded values
- All motion respects `prefers-reduced-motion`. Every animation has a variant without movement or blinking, tested like the existing fill transition of the Spillit cells
- Animate only `transform` and `opacity`

## Palette, roles and shape

**Built** in `packages/game-kit/src/styles/tokens.css` (tier 1 palette, tier 2 roles, tier 3 components). Light and dark go through `light-dark()`, components use roles only.

- **Light:** violet and magenta on rose white. Page `--surface-color` is rose white, raised surfaces white, text a near-black violet, `--accent-color` violet, `--link-color` magenta
- **Dark:** aubergine with a yellow accent. Page is dark aubergine, raised surfaces a notch lighter, text rose white, `--accent-color` yellow, `--link-color` light violet
- **Chrome (header and footer):** own roles `--chrome-surface-color`, `--on-chrome-color`, `--chrome-accent-color`, `--chrome-focus-ring-color`. Light: page colored with a magenta accent line. Dark: aubergine a little lighter than the page with a yellow accent
- **Status roles:** `--success-color`, `--warning-color`, `--danger-color`, each with an `--on-*-color` pair for text and icons on a filled background (`--on-accent-color`, `--on-success-color`, `--on-danger-color`, `--on-warning-color`)
- **Shape tokens:** `--radius-sm`, `--radius`, `--radius-lg` (cards, tiles), `--radius-pill`, `--shadow-card`, `--shadow-raised`, `--card-padding`
- **Font:** Noto Sans, self-hosted (variable font file in `packages/game-kit/src/styles/fonts`, `@font-face` in `fonts.css`, license `OFL.txt` next to it), system fonts as fallback. Nothing is loaded from a third party. **To do:** WOFF2 and a Latin subset to shrink the file. **Possible later experiment:** Short Stack for headings, not decided and not built
- **Contrast** of the role pairs is checked in `tokens.test.ts`

## Buttons

**Built:** `AppButton` in `packages/game-kit/src/buttons` is the shared button for the platform and the games. It has the variants `primary`, `secondary` and `danger`, an optional icon slot and a link form (`as` a router link or `a`). It renders a native `<button>` by default. The footer buttons, the main menu, the notice bar, the abort dialog, the `HowToMore` button, the start button of the game page and the next button of the result use it.

The button is 3D: a bottom edge of `--button-edge-height` in a darker tone of the variant color (mixed with `--button-edge-mix-color`). On press it moves down by that height, so the edge disappears. With `prefers-reduced-motion` the press has no transition.

## Platform start page

**Built:** `apps/web/src/game-selection/GameSelectionView.vue`, in the centered content column (at most 960px).

```
+------------------------------------------------+
| Header                                         |
|------------------------------------------------|
| Hero: heading and intro text                   |
|                                                |
| [Tile] [Tile] [Tile] ...   (fluid grid)        |
|                                                |
| [puzzle icon] "More games are coming"          |
|------------------------------------------------|
| Footer                                         |
+------------------------------------------------+
```

- **Hero:** a heading and a short intro text above the tiles
- **Grid:** fluid (`auto-fill`, tiles at least 10rem wide). Same design and CSS on desktop and mobile: the tiles wrap where there is room, down to one column on a phone
- **Coming-soon block:** below the tiles, a puzzle icon with a short text that more games follow. It is static text, not a tile and not a link

### Tile

**Built:** `GameTile.vue` in `apps/web/src/game-selection`. The tile is a link to the game page. The top part is a gradient from `--game-color` to `--game-color-deep` with the game symbol in `--on-game-color`; below it the body holds the name and, if a result exists, two pills: level (left) and score (right). Without a result both pills are hidden and only the text "No result yet" remains for screen readers. The level pill shows the highest level with a result until the profile exists.

**Ownership:** the tile component lives in the platform (link, size, focus, grid, pills). The game does not bring a component, it provides the data that fills the tile: `symbol` and the primary color in the manifest, name and score display in its texts (see `game-contract.md`). So every tile looks and behaves the same, and nothing of the game is loaded for the start page.

**To try:** position and colors of the pills are not fixed and may change after the look is checked in the browser.

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

**Built:** `gameColors` in `core`, the manifest field `color` (Spillit is `orange`), the classes in `packages/game-kit/src/styles/game-colors.css`. Each class sets `--game-color`, `--game-color-deep` (the darker end of a gradient) and `--on-game-color`. The start page tile, the symbol tile and heading of the game page and the highlight of the `LevelPicker` use the color. Orange uses the vivid tone `--orange-vivid` in light mode (`--orange-dark` stays for `--warning-color`) and dark text on it, because a bright orange cannot carry light text. `--game-color` is for headings, icons and borders (3:1 on the page), not for small body text. The helpers `.text-game`, `.bg-game` and `.border-game` exist, but no component uses them yet.

### Game page

**Built:** `apps/web/src/game/GameView.vue`. From top to bottom:

- **Header block:** a card with the game symbol on a gradient tile (game color), the name as heading in the game color, the `tagline`, the `summary` (both from `GameTexts`) and the rules accordion
- **Rules accordion:** a native `<details>` element with the summary "Game rules" and a chevron. The rules (`HowToPlay`) load with the game module and show inside once it is open. No JavaScript is needed for opening and closing
- **Level section:** heading and the `LevelPicker`
- **Start bar:** shows "ready" with the name of the selected level, the best points of the level ("—" while none) and the primary start button. On a phone the bar is sticky at the bottom of the screen, from 40rem up it is a normal row

### Level selection

The level selection is a shared component `LevelPicker` in `game-kit`, used by the platform on the game page. **Built:** `packages/game-kit/src/level-picker`.

- **Level cards:** one card per level in a fluid grid (`auto-fit`, at least 11rem; one column on a narrow phone). A card shows the level label, an optional preview, the best points of the level if there are any, and a check mark on the selected card. The selected card is highlighted in the game color
- **A real selection underneath:** the picker is a radio group (visually hidden `<input type="radio">`), so keyboard (arrow keys), screen readers and focus work without extra code. The look is only styling
- **Slot per card:** the picker owns selection and focus, the game fills the preview through the slot `step`. Spillit fills it with its optional `LevelPreview` (a small grid per level: 6×6, 10×10, 14×14)
- **Many levels:** a game with many levels would need a scrollable mode of the same component without changing its API. Not built until a game needs it
- **No locks for now:** all levels are freely selectable. A level with different rules is just another level with its own ID. A rule for locked levels is not built on stock. It would need profile and storage, and the platform would have to enforce it on the route as well, so a direct URL cannot bypass it. A game may later bring its own level selection if it needs one (see `game-contract.md`)

## Deliberately left out

The design screens show more than is built. These parts are left out on purpose, because they need data or features that do not exist or that the project does not want (no tracking, no backend, no rankings):

- Streak, rank and star ratings
- Filter bars and category pills on the start page
- Decorative pills beyond the level and score pills on the tile

## Open

- **Last played level:** the pill on the tile needs storage that does not exist yet (the best results only give the highest level with a result). It is decided together with the profile. Until then the pill shows the highest level with a result
