# Ideas (Mindwhile)

Status: collection. The design direction of the start page, tiles, pills, dialogs and the level selection is in `design.md`. Nothing here is decided or planned. An idea becomes a decision when it moves into the matching document (`architecture.md`, `tech-stack.md`, `game-contract.md`, a game document) or into a plan. Ideas for further games are in `game-candidates.md`.

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

## Spillit variants

### Joker

- From a certain point on, the player gets a joker that can be used every N moves, for example colors a whole row or column, or an area, no matter what the neighbors look like. The player keeps playing and gets more options
- Open: "from a certain point" can mean inside a round (after some moves or a fill level) or across rounds (unlocked by results). Inside a round it is pure game logic and changes nothing in the game contract. Across rounds it is an unlock rule that needs profile and storage and that the platform would have to enforce on the route
- A variant with a joker is its own level (for example `d`) with its own parameters and its own par, because the greedy par without a joker makes `points = base × par / moves` meaningless. Results are only compared per game, level and scoring version, so a rule variant has to be a level
- The joker use has to be part of the move list (position, direction), so the same seed and the same moves give the same result on every device
- A par that takes the joker into account is harder to compute than the greedy par. That is its own topic when this idea is picked up

## Shared components

- Provide a centralized button component. The dropdown for the level selection is replaced by the `LevelPicker` (see `design.md`)
- General rule: whenever a component is used across more than one package, it moves into a shared place (`game-kit`), instead of being built twice

## Notes for when these ideas are picked up

- Each animation needs a reduced-motion variant, tested like the existing fill transition of the Spillit cells
