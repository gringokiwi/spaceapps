# debris

*Every piece left behind has a story.*

A web game for kids aged 7 to 12, made for NASA Space Apps. They pick up litter on Earth and scan it with a phone. Each piece they bin unlocks the next chapter of the team's story, **Abandoned but Not Forgotten**: 13 machines people left on the Moon, on Mars and out in space. Each chapter earns a patch for their explorer jacket.

The screens follow the team's design canvas, *Debris App Screens*. The story is the team's storyboard, word for word: [`docs/abandoned-but-not-forgotten-storyboard.md`](docs/abandoned-but-not-forgotten-storyboard.md).

No payments, no accounts, no ads. The scanner is adapted from Litter Spotter in [isla-skills](https://github.com/katamar-lang/isla-skills) (`netlify/lib/spotter.mjs`), which is only read, never changed.

## How it plays

1. **Welcome**, then the **opening scene** (the storyboard's "96 bags on the Moon"), four **safety rules**, and a **nickname** with a **crew buddy** (Eagle, Hadley, Oppy, Ginny, Voyager or Viking). All of it stays on the phone.
2. **One round:** scan a piece of litter → hear the next chapter → bin it → earn that chapter's patch.
   - **Scan:** the camera opens inside the page. If it can't, the button opens the phone's camera instead. Eagle, the lander, checks the photo.
   - **Litter found:** what it is and which bin it goes in.
   - **Story:** the chapter in the storyboard's five parts (where it is now, what it was, what it did, why it was left there, still helping us), with its kid hook, its NASA sources and a **Listen** button that reads it aloud.
   - **Bin it:** which bin, then "It's in the bin!". "Save it for later" keeps the piece waiting on Home.
   - **Patch unlocked:** the chapter's patch and the storyboard's pick-up line for the next piece.
3. **Sharp or dangerous** (broken glass, needles, chemicals): "Stop! Don't touch it." Ask an adult. It never counts for a patch, so a child never has to touch it.
4. Photos of people or screens, or things that aren't litter, don't count. Eagle asks for another photo.
5. **My jacket** shows all 13 patches; tap one to hear its story again. **Me** has the cleanup log, the language (English, Español, Português) and a section for grown-ups.
6. After chapter 13: the **finale**, with the pieces collected, every patch and a map of the 13 resting places. Children can keep scanning after that; nothing is ever lost.

Add `?demo` to the address to show the app without the scanner: Eagle pretends to scan (no camera needed), and demo progress is kept apart from real progress.

## Files

| File | What it is |
|---|---|
| `index.html`, `style.css`, `game.js` | The app: screens, the round, camera, read-aloud, and every word on screen in English, Spanish and Portuguese |
| `art.js` | The drawings as SVG: Eagle, the crew buddies, the 13 chapter patches, the bins, the finale map |
| `content.json` | The story in English, Spanish and Portuguese: opening scene, 13 chapters, finale. English is the storyboard word for word. `links` are the storyboard's sources; `image` can hold a NASA picture per chapter |
| `docs/abandoned-but-not-forgotten-storyboard.md` | The team's storyboard, exported from the team's doc |
| `img/chapters/` | NASA images for the chapters go here (e.g. `img/chapters/1.jpg`, then set `"image": "img/chapters/1.jpg"` in `content.json`). Until then each chapter shows its patch |
| `netlify/functions/scan.mjs` | `POST /api/scan` `{image, lang}`: sends the photo to Claude and answers in the player's language. The photo is never stored |
| `netlify/functions/counter.mjs` | `GET /api/counter`: how many pieces of litter all players have found |
| `netlify/lib/scanner.mjs` | The scanner (Claude Haiku with vision). Returns `is_trash` (yes / no / unsure), `type`, `bin`, `dangerous`, `item` (a short name, like "Plastic wrapper"), `message` and `photo_problem` |
| `netlify/lib/common.mjs` | Photo limits, storage (Netlify Blobs) and helpers |

## Privacy

- Photos are never saved: the phone shrinks them, the server sends them once to Claude and forgets them. The camera stops as soon as the child leaves the scan screen.
- No names, emails or personal data. The profile is a nickname and a crew buddy in `localStorage`.
- Progress, patches and the cleanup log (date and type of each piece) live on the phone.
- The server only keeps counters: pieces found, and photos analysed per day. The per-player limit uses a sha256 of the IP and the day; the IP itself is never stored.

## Bins

The game uses Colombia's colour code (Resolución 2184 de 2019): **white** for recyclables (clean plastic, cans, paper, cardboard, glass), **green** for food scraps, **black** for everything else. Batteries, electronics, chemicals and dangerous items go to a **special drop-off**, with an adult. For another country, change `BINS` and the prompt in `netlify/lib/scanner.mjs`, and the bin words in `game.js`.

## Deploy on Netlify

1. Create a new Netlify site from this repo. The publish folder is the root (`netlify.toml` already says so).
2. In **Site configuration → Environment variables** add `ANTHROPIC_API_KEY` (secret, server only).
3. Optional: `PHOTOS_PER_DAY` (300) and `PHOTOS_PER_PLAYER_PER_DAY` (30) to protect the AI bill.

## Tested

- Server, with a fake Claude: Spanish and Portuguese answers, the new `item` field, a person in the photo (no name kept), sharp things marked dangerous, unknown language, AI failure, bad photo, per-player limit, scanner switched off, counter, and that the photo is never stored.
- Whole app in Chromium with a fake camera (phone 390 × 844, 320 × 640 in Spanish, desktop): onboarding, a full round, chapters 1, 2 and 13 checked against the storyboard, danger, retake, not litter, server error, save for later across a reload, jacket, cleanup log, Spanish and Portuguese, special drop-off, the finale and a 14th piece, no camera (file picker), demo mode with no server, the back button, no sideways scroll, and buttons at least 44 px.
- **Not yet**: the real Claude key with real photos, and NASA pictures for the chapters.
