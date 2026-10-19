# Ideas (Mindwhile)

Status: collection. Nothing here is decided or planned. An idea becomes a decision when it moves into the matching document (`architecture.md`, `tech-stack.md`, `game-contract.md`, a game document) or into a plan. Ideas for further games are in `game-candidates.md`.

## Overall impression

- The whole system should give a fun and animated impression
- All motion respects the system setting for reduced motion (`prefers-reduced-motion`). With reduced motion the animations below are switched off and the state changes happen without movement or blinking

## Spillit animations

### Color buttons slide so the disabled one is always last

- The button of the current region color is disabled. It always sits last in the row of color buttons
- When the region color changes, the buttons move: the newly disabled button slides to the end, the others slide to close the gap
- The slide is fast
- Only without reduced motion. With reduced motion the buttons just change position

### Highlight after a move

- After a move, the buttons that can be used next get a short highlight with a light box-shadow
- The top left cell gets the same highlight
- Buttons and top left cell blink together for 200ms (on and off)
- Only without reduced motion

## Start page

- The start page should be more colorful
- Each game has a dominating color. The game's icon uses that color, maybe also the title
- Score and challenge are shown as pills: one at the top left, one at the top right of the title or the icon
- Both pills have a light background (for example light yellow) and dark text

## Shared components

- Provide a centralized button component and a centralized dropdown component
- General rule: whenever a component is used across more than one package, it moves into a shared place (`game-kit`), instead of being built twice

## Notes for when these ideas are picked up

- Each animation needs a reduced-motion variant, tested like the existing fill transition of the Spillit cells
- The dominating color of a game is per game data, so it would belong to the game's own tokens and to a field the platform can read without loading the view (like the manifest field `symbol`). Contrast of icon, title and pills has to hold in light and dark
- The score pill on the start page shows the same information as the best result line of the game tile (best result of the highest challenge, with its challenge label); the pills would show it in a different form
