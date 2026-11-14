# Planet Patrol

A web game for kids aged 7 to 12. They pick up trash on Earth, scan it with a phone, and finishing missions unlocks stories about the machines humanity left on the Moon and Mars.

No payments, no wallets, no accounts. The scanner is adapted from Litter Spotter in [isla-skills](https://github.com/katamar-lang/isla-skills) (`netlify/lib/spotter.mjs`), which is only read, never changed.

## How it plays

1. The player picks a **nickname** and an **avatar**. Both stay on their phone.
2. They take a photo of one object. **Spark**, the robot, says whether it's trash, what type it is, and which bin it goes in.
3. Trash = 10 points. If it's dangerous (broken glass, needles, something sharp, chemicals), Spark says **"Don't touch it! Call an adult"** and still gives the points.
4. Photos of screens or with people in the foreground don't count: Spark asks for another photo.
5. Missions (`missions.json`) give badges and open stories (`stories.json`).

## Files

| File | What it is |
|---|---|
| `index.html`, `style.css`, `game.js` | The page: robot, points, missions, stories and log |
| `missions.json` | Missions. Each has a goal (item type, count, all-time or in one day) and the story it opens |
| `stories.json` | 6 story slots: `title`, `text`, `image`, `source`, `place`. While `title` is empty the game shows "Story on its way" |
| `img/stories/` | Story images go here (e.g. `img/stories/1.jpg`) |
| `netlify/functions/scan.mjs` | `POST /api/scan`: sends the photo to Claude and returns the result. The photo is never stored |
| `netlify/functions/counter.mjs` | `GET /api/counter`: how many items all players have picked up |
| `netlify/lib/scanner.mjs` | The scanner (Claude Haiku with vision). Returns `is_trash` (yes / no / unsure), `type`, `bin`, `dangerous`, `message` and `photo_problem` |
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
- Whole page with Playwright (iPhone 13, 320 px, desktop): profile, robot states, points, missions, queued awards, log, empty and filled stories, unsafe links blocked, no sideways scroll, buttons at least 44 px.
- Functions bundle with `@netlify/zip-it-and-ship-it` and load without `require(esm)`.
- **Not yet**: the real Claude key with real photos.
