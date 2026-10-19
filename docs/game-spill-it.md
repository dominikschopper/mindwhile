# Game concept: Spillit (game ID `spill-it`)

Status: draft. Spillit is our version of the classic flood-fill game and the test game of the beta. Platform rules, formats and versioning live in `architecture.md`, terms in `glossary.md`. The game ID in code is `spill-it`.

## Basic rule

- The board is a grid of colored cells
- The start region is the top-left cell together with all connected cells of the same color
- One move: the player picks a color, the whole region takes that color and swallows all adjacent cells that already have this color
- Goal: the whole grid has a single color

## Decisions

- **No move limit.** The round ends as soon as the grid is single-colored. The only round end is "won", there is no "lost"
- **Scoring:** two values, `[points, deviation]`. Points: `floor(basePoints * par / moves / 10) * 10`, integer arithmetic only, higher is better. A game on par gives the base value of the challenge (`a` 500, `b` 750, `c` 1000), fewer moves give more points, more moves fewer, never negative. The ratio takes the par of the board into account, so boards with different par stay comparable. The deviation (moves minus par, integer, fewer is better) is the second value and breaks ties, because points are rounded to tens. Exact par is not needed, the greedy par is the reference. Every completed run produces a comparable result. The base values are part of the scoring version (starting values until the first release)
- An abort discards the state without a result (platform rule)
- **Par: deterministic approximation (greedy), for now.** In every step the color is chosen that absorbs the most new cells, on a tie a fixed color order applies. The number of steps until the grid is single-colored is the par. Integers only, same result on every device. On a tie the lowest color index wins. Par is not optimal, the deviation can be negative (player better than greedy). The method belongs to the scoring version: if it is changed, the scoring version goes up and old results stay separate
- **Challenges for the beta: three.** In code they are called `challenge` with the IDs `a`, `b`, `c` (see `glossary.md`): `a` = 6×6 with 4 colors, `b` = 10×10 with 5 colors, `c` = 14×14 with 6 colors. Further challenges (for example with blocked cells) are added later as new challenges. Because every result stores its challenge and the best result is kept per challenge, new challenges do not touch existing best results. If, on the other hand, grid size, number of colors, generator or par of an existing challenge changes, the scoring version goes up
- **Generator: every cell random, uniformly distributed, with a minimum check, for now.** The generator is mulberry32 from `core` (unsigned 32-bit output, no `Math.random()`). Cells are drawn row by row, the color of a cell is `next() mod colorCount`. Boards that are too easy are discarded and the next full board is drawn by continuing the same stream (never by reseeding), which stays reproducible. After 1000 draws without an accepted board `createRound` throws. The only criterion is a minimum par per challenge: `a` 5, `b` 12, `c` 20 (starting values, no start-region criterion). Measured over 10 000 seeds per challenge, 0.3 to 0.9 percent of first draws are rejected. The check uses the same greedy method as the par. The generator and the minimum par belong to the scoring version. A later change, for example to connected patches, means a new scoring version
- **Start point: always top left** (as in the basic rule). Other start points and further twists are in the idea store and come after the beta at the earliest
- **Seed: random per round, no repetition in the beta.** Every new round of a challenge has a new board, best results build up over many boards (the points relate the moves to the par of the board, which makes them comparable). "Same board again" and shareable seed codes come after the beta at the earliest, then with a rule on whether repetitions count toward the best result
- **Display during the round: move counter and par visible from the start** (for example "Moves 7 / Par 20"). That par is an approximation and that you can beat it (more points than the base value, negative deviation) is explained by the how-to-play dialog of the game (every game has one, see `architecture.md`), after the round the result shows the deviation
- **Controls: color and mark always together.** Every color has a fixed mark in the cell, in this order: `x`, `*`, `o`, `-`, `#`, `|`. A challenge uses as many of the first marks as it has colors (4, 5 or 6). The mark belongs to the presentation, not to the scoring (no version bump when it changes). A color bar at the bottom to tap, the same marks on the color buttons. Reduced motion (following the system setting) switches off the fill animation. Every color has a screen reader label with color name and mark, keyboard operation is possible. To check while trying it out: whether `-` and `|` stay legible next to grid lines and whether mark and color can still be told apart on small cells (14×14)
- **Round behavior.** A move is `{ type: 'pick', color }`. Picking the color the start region already has, or any move after the board is solved, is ignored and not counted. Invalid data throws. `serialize()` returns `{ moves }` (the counted colors), board and counter are replayed from seed and moves on restore
- **Scoring version 0 until the first release.** `scoringVersion` is 0 while no release exists and becomes 1 with the first release. Until then generator, par and minimum par may change without raising it, from the release on every change raises it
- **Scoring tests: fixed test cases per challenge (mandatory).** Several fixed seeds per challenge. Every test checks the generated grid as text (mark per cell), the par and a move sequence with the expected move count and deviation. In addition edge cases: discarded boards that were too easy, ties in the greedy choice, negative deviation. If generator or par change, the tests fail and force a new scoring version. The seeds and expected values were generated once from the implementation and pinned (5 seeds per challenge in `src/scoring.<challenge>.test.ts`)

## Ideas for later (not decided)

Change rules or board (own challenge, own best result, scoring version goes up when generator or par change):
- Hex grid
- Blocked cells (goal: all free cells single-colored)
- Other start point: center, random, two start regions, freely chosen (harder)
- Move limit (for example par plus three, with "lost" as a second round end)
- Wrap-around grid
- Switching cells (change color after every move)
- Move rule: the same color may not be chosen twice in a row
- Special cells (joker, cells that recolor their neighbors)
- Undo (needs a rule whether it counts or is limited)

Do not touch the scoring:
- Show the par solution after the round as a replay
- Color palettes and patterns, own themes
- Animation of the fill wave, vibration, sound (off by default)

For group and daily boards the challenge determines which twist applies.

## Open

Nothing is open for the game concept. Open points are in `architecture.md` and `tech-stack.md`.
