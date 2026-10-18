# Game candidates (Mindwhile)

Working document for collecting, extending and reducing. Everything here is a proposal, nothing is final.

## Constraints

Guardrails and core decisions (scoring, groups, identity, backend) live in `architecture.md`. For choosing games the main points are: best results are kept per game, group boards are asynchronous and need a seed (for games with fixed boards the seed is the number of the board).

## Rating scale

`+` good, `o` medium, `-` difficult

| Criterion | Question |
|---|---|
| Round | Does it fit short breaks on the go? |
| Touch | Playable without hover and fiddling? |
| Generatable | Can it be generated from a seed and checked for solvability/uniqueness? |
| Legal | Mechanic free, name and material uncritical? |
| Group | Suitable as a shared board (same seed)? |
| Effort | Implementation effort (`+` = low) |

## Starter candidates (seven)

| Game (working title) | Type | Scoring | Round | Touch | Generatable | Legal | Group | Effort | Note |
|---|---|---|---|---|---|---|---|---|---|
| Merge (2048 variant) | Sliding/numbers | Highest tile, then moves | + | + | + | o | + | + | Own name, own rules (hex, primes, obstacles) |
| Hanoi | Planning | Moves (par) | + | + | + | + | + | + | Public domain, 4 pegs and color rules as a twist |
| Mines | Deduction | Time | o | o | o | o | + | o | Solvable without guessing via solver, "Minesweeper" is a trademark |
| Lights Out | Pattern | Moves | + | + | + | + | + | + | Twist: neighborhood patterns, hex |
| Flood-Fill | Strategy | Deviation from par | + | + | + | + | + | + | **Decided, first game of the beta** (working title in the app: Spillit), details in `game-flood-fill.md`. Move limit later as a challenge of its own |
| Takuzu (symbols) | Deduction | Time | o | + | + | + | + | o | More symbols as a difficulty step, tell symbols apart by shape |
| Sokoban variant | Planning | **none** (see below) | - | o | o | - | o | - | Own name and own levels needed |

### Open point: Sokoban

- Idea: offer it without a best result, pure puzzle fun.
- Alternative: scoring by moves per board number, group board = number of the fixed board as seed.
- Levels: generate backwards (solvability guaranteed) or hand-built/freely licensed (check the license per collection).
- Name rights: "Sokoban" is a trademark, original levels are protected.

## Pool (further candidates, to be sorted out later)

| Game | Type | Scoring | Round | Touch | Generatable | Legal | Group | Effort | Note |
|---|---|---|---|---|---|---|---|---|---|
| Sliding puzzle (15 puzzle) | Sliding | Time/moves | + | + | + | + | + | + | Patterns instead of numbers, 3×3 to 6×6 |
| Pipe puzzle | Rotating | Moves/time | + | + | + | + | + | o | Move budget as a twist |
| Mini sudoku (symbols) | Deduction | Time | o | o | o | o | + | o | 4×4, 6×6, also for children, "Sudoku" may be a trademark depending on region |
| Nonograms | Deduction | Time | - | o | - | + | + | - | Picture appears when solved, uniqueness is costly |
| Futoshiki / Kenken variant | Deduction | Time | o | o | o | o | + | o | Inequality signs or arithmetic blocks |
| Kakuro-light | Numbers | Time | - | o | - | + | + | - | Small grids only |
| Mastermind variant | Deduction | Moves | + | + | + | o | + | + | Colors with rules, "Mastermind" is a trademark |
| Nim against AI | Strategy | Wins/moves | + | + | + | + | o | + | Difficulty via flawed opponents |
| Peg solitaire | Planning | Moves/leftovers | o | + | o | + | o | o | Board layouts as challenges |
| Connect-four variant | Strategy | Wins | o | + | n/a | o | - | o | Against AI, check the name |
| Word ladder | Word | Moves | o | o | o | o | + | o | Language dependent, check the word list license |
| Memory (symbol pairs) | Memory | Time/moves | + | + | + | + | + | + | Very simple, also for children |

## Deliberately left out

- Tetris and Wordle (trademark and legal situation)
- Candy-style match-3 (legal risk, addictive mechanics do not fit the platform)

## Open questions

- Which games from the pool move into the start, which are dropped?
- Is a game without a best result (Sokoban) fine for the platform, or should every game have scoring?
- Do we need at least one very simple game for children (Memory, mini sudoku)?
- Working titles for the further games (own names because of the trademark question). Flood-Fill is called Spillit in the app for now
