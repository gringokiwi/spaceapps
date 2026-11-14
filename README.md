# Planet Patrol

A web game for kids aged 7 to 12. They pick up trash on Earth, scan it with a phone, and finishing missions unlocks stories about the machines humanity left on the Moon and Mars.

No payments, no wallets, no accounts. The scanner is adapted from Litter Spotter in [isla-skills](https://github.com/katamar-lang/isla-skills) (`netlify/lib/spotter.mjs`), which is only read, never changed.

## How it plays

1. **Begin.** The player picks English, Spanish or Portuguese and hears the opening story, *96 bags on the Moon* (a narrator can read every story aloud).
2. The player picks a **nickname** and an **avatar**. Both stay on their phone.
3. Before the first photo, a safety screen: gloves, a grown-up, never touch glass, needles or anything sharp.
4. They take a photo of one object. **Spark**, the robot, says whether it's litter, what type it is, and which bin it goes in, in the player's language.
5. Every piece of litter unlocks the next of **13 chapters**: machines people left on the Moon, Mars and beyond, from Surveyor 3 (1967) to Ingenuity (2021). Each has a badge, a story, a "Did you know?" fact and its source.
6. Dangerous litter (broken glass, needles, sharp things, chemicals): Spark says **"Don't touch it! Call a grown-up"** and it still counts. Photos of screens or with people don't count.
7. After the 13th piece: the **finale**, with the count, all 13 badges and a map of the 13 resting places.
8. **Missions** keeps every unlocked chapter, the map and the finale. Progress is never lost: the player can close the app and come back.

Add `?demo` to the address to try it without the AI: Spark pretends, and the page says so.

## Files

| File | What it is |
|---|---|
| `index.html`, `style.css`, `game.js` | The page: opening, robot, scanner, missions, map, chapters, finale and log, in 3 languages |
| `content.json` | The story: opening, 13 chapters and finale, each in `en`, `es` and `pt`. Each chapter has an `image` field for a NASA picture (empty = a drawing) |
| `img/chapters/` | NASA pictures for the chapters go here (e.g. `img/chapters/1.jpg`) |
| `netlify/functions/scan.mjs` | `POST /api/scan {image, lang}`: sends the photo to Claude and returns the result. The photo is never stored |
| `netlify/functions/counter.mjs` | `GET /api/counter`: how many items all players have picked up |
| `netlify/lib/scanner.mjs` | The scanner (Claude Haiku with vision). Returns `is_trash` (yes / no / unsure), `type`, `bin`, `dangerous`, `message` (in the player's language) and `photo_problem` |
| `netlify/lib/common.mjs` | Photo limits, storage (Netlify Blobs) and helpers |

## Privacy

- Photos are never saved: the phone shrinks them, the server sends them once to Claude and forgets them.
- No names, emails or personal data. The profile is a nickname and an avatar in `localStorage`.
- The log (date, type, points) lives on the phone.
- The server only keeps counters: total items, and photos analysed per day. The per-player limit uses a sha256 of the IP and the day; the IP itself is never stored.

## Bins

The game uses Colombia's colour code (Resolución 2184 de 2019): **white** for recyclables (clean plastic, cans, paper, cardboard, glass), **green** for organic, **black** for non-recyclable. Batteries, electronics, chemicals and dangerous items go to a **special drop-off**, with an adult. For another country, change `BINS` and the prompt in `netlify/lib/scanner.mjs`, and `BIN` in `game.js`.

## Deploy on Netlify

1. Create a new Netlify site from this repo. The publish folder is the root (`netlify.toml` already says so).
2. In **Site configuration → Environment variables** add `ANTHROPIC_API_KEY` (secret, server only).
3. Optional: `PHOTOS_PER_DAY` (300) and `PHOTOS_PER_PLAYER_PER_DAY` (30) to protect the AI bill.

## Tested

- Server, with a fake Claude: trash, dangerous, screen, people, not trash, unsure, AI refusal, bad photo, limits, counter, and that the photo is never stored.
- Whole page with Playwright (iPhone 13, 320 px, desktop): opening and language switch, profile, safety screen before the first photo only, all 13 unlocks, chapters, finale, map, missions after a reload (nothing lost, nothing replayed), demo mode, no sideways scroll, buttons at least 44 px.
- Server: messages in Spanish and Portuguese, and the prompt asks Claude for the player's language.
- Functions bundle with `@netlify/zip-it-and-ship-it` and load without `require(esm)`.
- **Not yet**: the real Claude key with real photos, the narrator voice on real phones, and the NASA pictures (still to choose).
