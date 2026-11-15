# debris: screens and state

The app is a small state machine. This page writes it down: what is saved, every screen, when it may open, and the rules the tests check. The code is `game.js` (`S` is the state, `screens` the screens, `GUARD` the rules for opening them, `go()` the only way to move).

## What is saved on the phone (localStorage, `debris.` + key; `debris.demo.` in demo mode)

| Key | Value | Changes when |
|---|---|---|
| `lang` | `en`, `es` or `pt` | the child picks a language |
| `teller` | `space` or `boi` (the Bull) | the choice screen, Me or Explore. Never touches progress |
| `tellerChosen` | true once the choice screen was answered | first launch |
| `introDone`, `safetyDone` | true once the opening and the safety rules were seen | first launch |
| `profile` | `{ nick, buddy }` | the nickname screen |
| `pending` | the piece in the child's hand: `{ item, type, bin, saved, ticket }`, or null | a scan finds litter; binning or "That's not right" clears it. `saved` = kept for later |
| `binned` | patches earned, 0 to 13. Only ever goes up | "It's in the bin!" (up to 13) |
| `log` | every piece binned: `[{ date, type }]`. Only ever grows | "It's in the bin!" |
| `lastNew` | the newest patch, for the jacket's "new" tag | "It's in the bin!" |
| `tickets` | pick-ups waiting to be counted on the server | "It's in the bin!" adds one; each is sent once, then removed |
| `finaleSeen`, `jacketSeen` | confetti and the 3D jacket's "stick on" animation play once | the finale, the jacket |

In memory only (gone after a reload): `scan` (this round's photo and answer), `earned` (whether the newest eating or patch moment has played), `view`, the shared totals.

## Screens

Every screen has a rule (`GUARD`). If it fails, the app goes Home (or Welcome before there is a nickname). Screens marked **address** can also be opened by typing `#name` or after a reload.

| Screen | Opens when | Leads to |
|---|---|---|
| `welcome` | always | choice screen (or the opening), grown-ups |
| `storyteller` | the Bull's lines loaded | the opening |
| `opening` | always | safety rules (or back to the jacket / Explore) |
| `safety` | always | nickname (or back to Me / grown-ups) |
| `profile` | always | Home (or Me) |
| `home` **address** | there is a nickname | scan, bin (if holding a piece), jacket, Impact, Me, finale (at 13) |
| `scan` | nickname, and not holding a piece saved for later | found, danger, retry |
| `found` | this round's scan found litter and the piece is in hand | Space: the chapter, then bin. Bull: bin first |
| `story` | chapter 1 to 13, already earned, or the next one while holding a piece (Space round), or from Explore | bin (Space round), scan / jacket / finale (Bull round), back |
| `bin` | holding a piece | "It's in the bin!" → patch (Space) or eating screen (Bull); "Save for later" → Home |
| `unlocked` | Space: the patch just earned (its chapter number is in the screen's address entry) | jacket, scan, finale |
| `feast` | Bull: the eating moment for a chapter already earned (number in the entry) | the chapter, scan, finale |
| `danger`, `retry` | this round's scan was dangerous / not usable | scan again, Home |
| `jacket`, `me` **address** | there is a nickname | chapters, the opening, settings |
| `grownups`, `photos`, `sources`, `explore`, `usage`, `impact` **address** | always | back |
| `finale` **address** | all 13 patches | Home, Impact (Bull), any chapter |

A round: **Space** scan → found → chapter → bin → patch. **The Bull** scan → found → bin → the Dragon eats ("Chomp!") → the explorer wakes up → chapter. The step pill follows the same order (`ROUND` in `game.js`).

## Rules the tests check

- `binned` and `log` never go down; `binned` ≤ 13 and ≤ the number of pieces in `log`.
- Each pick-up ticket is sent once and counted once; at rest, every binned piece with a ticket has been counted.
- Changing the storyteller or the language never changes progress.
- Every screen has a heading and a way out; the address always names the screen on show.
- The eating moment and its "Chomp!" play once per pick-up. Going Back to it shows it settled, for the right chapter.
- A screen's set-up (`after`) is safe to run twice, because changing the language redraws the screen.

The random-walk test (`tests/monkey.cjs`) taps, goes Back and Forward, reloads, types addresses and switches language and storyteller at random, checking these rules after every step.
