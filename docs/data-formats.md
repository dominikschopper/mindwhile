# Data formats (Mindwhile)

Status: draft, filled decision by decision. Rules and reasons live in `architecture.md`, the interface between platform and game in `game-contract.md`, terms and code names in `glossary.md`. These formats are hard to change later, so they are fixed before the first code.

## Decided

### Score values

- A result stores only the numbers: `scoreValues: [2048, 311]` in code, `score: [2048, 311]` in the format
- The direction of each position (`higher` or `lower` is better) is **not** stored in the result but in the game manifest, per scoring version, for example `{ key: 'deviation', better: 'lower' }`
- Results are only compared when game, challenge and scoring version match, so the direction is always unambiguous
- Comparison goes through the positions in order, on a tie the next position decides
- Raw integers only, no decimals

### Key style

- Readable keys instead of one-letter keys or positional arrays, because the format must stay additive and easy to debug. Compression removes most of the repetition
- Keys are abbreviated sensibly, not mechanically. `game` is used instead of a bare `id` so that a key never means two things (a profile also has a player ID)
- The mapping between format keys and code names lives in exactly one place (serialize and parse functions in `core`) and is covered by a round-trip test, so code and format cannot drift apart

| Code name | Format key |
|---|---|
| `gameId` | `game` |
| `gameVersion` | `gamev` |
| `challenge` | `chall` |
| `seed` | `seed` |
| `scoreValues` | `score` |
| `scoringVersion` | `scorev` |
| `playerId` | `player` |
| `dataFormatVersion` | `fmtv` |
| `gamerTag` | `tag` |
| `gamerSymbol` | `symbol` |
| `gamerTagChangedAt` | `tagat` |
| `bestResult` | `best` |

### Envelope

- One shared envelope for every transfer (export file, QR, link) with three fields: `app`, `fmtv`, `kind`
  - `app`: fixed technical identifier `mindwhile`, recognizes foreign files. It does not change when the display name changes
  - `fmtv`: data format version of the content
  - `kind`: the type of content, `profile` now, for example `board` later
- A reader rejects an unknown `kind`, a foreign `app` or a newer `fmtv` with a clear message ("The sender uses a newer version") instead of reading something wrong
- Example: `{ "app": "mindwhile", "fmtv": 1, "kind": "profile", "profile": { ... }, "best": [ ... ] }` (results per seed for daily and group boards are added later as a new optional field)

### Time stamps

- Stored as an integer, milliseconds since 1970 in UTC (for example `1760558400000`), also for `tagat`
- With the same player ID the more recent `tagat` wins, on an exact tie the tag from the imported file wins, so the import stays unambiguous
- Device clocks may be off, this is accepted

### Symbol

- Stored as a fixed name of the shape (for example `"star"`), not as a number, so extending or reordering the set of shapes never changes old profiles
- Shape names are permanent and never reassigned (same rule as challenge IDs)
- An unknown shape (from a newer version) is shown as a neutral placeholder symbol, the profile is not rejected because of it
- The list of shapes itself is defined elsewhere

### Player ID

- 64 random bits, written as 11 characters in base64url (for example `"q3J9xT2mVwA"`), created with `crypto.getRandomValues` from 8 random bytes
- Pure randomness, nothing about the device, no time component. Not a secret
- Reasoning (own estimate, birthday bound about n² / 2^65): a collision is practically negligible for a million players and still very unlikely for a hundred million. In a group of at most ten it is irrelevant. A later backend can handle the extremely unlikely collision when creating an account
- The encoding is a few lines of our own code with a test

### Result

- Fields and types: `game` (text), `gamev` (integer), `chall` (text), `seed` (integer, see Seed), `score` (list of integers), `scorev` (integer)
- A stored result has **no** `player`. Own results belong to the profile, whose player ID is stored once. This avoids a result carrying a different ID than the profile after an import overwrote the local ID
- `player` is added only when a result is shared into a group (later, `kind: board`), because there results of several players stand in one list
- So there are two forms of a result (with and without `player`), and the code keeps them cleanly apart through separate types
- Example (stored): `{ "game": "flood-fill", "gamev": 1, "chall": "a", "seed": 48213, "score": [-2], "scorev": 1 }`

### Best results and local flags

- For free play only the best result is stored: exactly one result per game, challenge and scoring version (stored in `best`, same fields as a result). It contains the seed of the board on which it was reached
- No history, no counter of played rounds, no statistics. This keeps exports tiny and fits "no tracking"
- Flags that only apply locally (install hint shown, how-to-play seen, counter of the backup reminder) live apart from the profile and are not exported
- For daily and group boards the result per seed is added later (see `architecture.md`)

### Seed

- An unsigned 32-bit integer (0 to 4 294 967 295), compact and unambiguous, fitting the usual small random generators with 32-bit state
- Games with fixed boards use small numbers (the number of the board). Daily boards derive the seed from the date, the exact rule is fixed with the daily feature
- Only the generator of a game interprets the seed. Human-readable seed codes, if wanted later, can be shown from the number (for example in another base) without changing the format

### Saved round state

- The platform keeps at most one running round per device and writes it after every move and when the app goes to the background. Envelope fields: `fmtv`, `game`, `gamev`, `chall`, `seed` and an opaque `state`
- The content of `state` is created and read by the game alone (any JSON), the platform knows nothing about game states
- If the state cannot be read any more (error, version jump), the app discards the round with a hint
- Games for which replaying fits (Flood-Fill, Hanoi) may store seed and move list inside `state` themselves, the platform does not require it
- This state is local and never part of an export
- **Active play time:** The game measures it itself with the clock from `core` (stops during pause and in the background) and keeps its state inside its own `state`, the platform stores nothing about time. If time counts for the score, the game turns it into a value in `score` (see `game-contract.md`)

### Data format version (`fmtv`)

- A running integer starting at 1. It versions the **structure** of the data, not the scoring
- It goes up only for a structural change that would make reading old data impossible, for example renaming a key, changing the type of a field or restructuring `best`
- It does **not** go up for: bug fixes, scoring changes (those raise `scorev`), a new optional field, a new `kind`, a new game or a new challenge
- Migration step by step: the reader migrates old data from version to version (1 to 2, 2 to 3, and so on), every step is a small tested function with test data of the old version. Always the current version is written. A newer version than known is rejected with a clear message

### Profile object

- `profile: { player, tag, symbol, tagat }`, built from the keys decided above
- `best`: a list of results (fields as in Result, without `player`)

### Import validation

- An import is input from outside (file, QR, link) and is validated completely before it changes the profile
- **Strict for envelope and profile:** if `app`, `fmtv` or `kind` do not match, or the profile is invalid (unreadable player ID, tag not following the rules, missing required fields), the whole file is rejected with a clear message
- **Tolerant for single results:** invalid entries in `best` (unknown game, wrong type, unknown challenge) are skipped and the app says so ("2 results could not be imported")
- Additional unknown fields are ignored so that newer versions stay additive
- Every field is checked for type and length, and there are upper limits for file size and number of entries
- The tag is always displayed as plain text, never as HTML

**Import limits (starting values, own estimates, not measured):**

| Limit | Value |
|---|---|
| Size of the file (compressed) | 256 KB |
| Size after decompression | 2 MB, decompression is aborted when exceeded |
| Entries in `best` | 2000 |
| Length of texts (`game`, `chall`, `symbol`) | 64 characters |
| Length of `tag` | 16 characters (as in `architecture.md`) |
| Values in `score` per result | at most 8 |
| Numbers | integers in the safe range (±2^53), `seed` 0 to 4 294 967 295 |

- The limits concern only the app and not the format, so they can be adjusted later without changing `fmtv`
- Decompression counts the size while it runs and aborts when the limit is exceeded, instead of decompressing everything first
- The limit for QR codes is fixed when QR is built, after the beta

### Transport (file, link, QR)

- Content: the envelope as JSON, compressed with gzip through the browser's `CompressionStream`, so common tools can open the file
- File name: `mindwhile-profile-YYYY-MM-DD.json.gz` (export date in local time). The date keeps several backups apart and avoids overwriting, it contains nothing personal
- Link: the same gzip bytes, written as base64url, in the part after the `#` (never sent to a server)
- QR: carries the same link. File and link contain exactly the same bytes, only packaged differently
- If a profile does not fit into a QR code, the app offers only the file for that profile and says so openly (see `architecture.md`)

## Open

- Limit for QR codes (size of a profile in a QR code), after the beta
- The list of symbol shapes (names), to be defined with the profile feature
