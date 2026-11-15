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
7. **Impact** (in the menu) shows how much litter everyone has picked up: a big total that counts up, and a "Litter to the Moon" tower that stacks every piece at 10 cm and compares it with famous tall things on the way to the Moon (see the team's spec, *Impact Screen Spec: Litter to the Moon*). Only confirmed pick-ups count: a piece adds 1 to the shared total when a child taps "It's in the bin!", never for a scan alone, a dangerous find or a find the child rejects.

## Two storytellers: Space Explorer and the Bull

After "Let's go!" on first launch, the child chooses who tells the story (the team's spec, *Boi de Mamão Storyteller: Spec and Script*). **Space Explorer** is the storyboard above and is chosen to start with. **The Bull** comes from Florianópolis's traditional bull dance (in Portuguese, the *boi de mamão*): in the play the bull falls down and goes quiet, and everyone helps bring him back to life. Here, the machines left in space have gone quiet too, and each piece of litter the child picks up wakes one of them.

- **English is for Americans: no Portuguese words.** In English the storyteller is "the Bull" (Spanish: "El Toro"), Bernúncia is "the Dragon", Maricota is "the Tall Lady", Cavalinho is "the Little Horse", and she eats with a "Chomp!". Only the Portuguese screens use "Boi de Mamão", "Bernúncia", "Maricota", "Cavalinho" and "Nhac!". English players see only the English verse; Portuguese players see only the Portuguese one.
- The facts in every chapter are the same with both storytellers, word for word. Only the narrator, the pick-up moment and a few lines change.
- **Opening:** the Bull dances in while the verse appears line by line (in the player's language) and a short festive tune plays. Then he talks to the child. The safety rules come next, as in the space version.
- **A round with the Bull:** scan → bin it → **the Dragon** (Bernúncia) gobbles the piece ("Chomp!"), a warm glow grows behind her tummy, and the Bull says one of his four pick-up lines (they take turns) → the explorer wakes up with a little dance → its chapter opens with one line from the Bull first, then the same facts.
- **Bernúncia** is drawn after the team's reference picture: one long yellow body with black stripes running into a long pointed snout, one round eye, a mouth open like a long V, and two pairs of legs (the children inside her). She faces right, like the picture; on the choice card and in the finale she turns to face the Bull.
- **Chapter 2:** the Tall Lady (Maricota, the very tall woman of the play) stands next to Eagle the lander.
- **Finale:** the 13 explorers dance with the Bull, the Dragon glows at full brightness, then the same ending with a button to Impact.
- **Languages:** the Bull's lines are in English and Portuguese (`boi.json`). Spanish players see the English lines (marked as English for screen readers) until Spanish is written. The storyteller is separate from the language.
- **Switching:** Me → Storyteller (and Explore all the stories, for teachers and judges). Switching keeps every patch, the jacket and the cleanup log. Players from before this change stay with the space story and never see the choice screen.
- **Drawings and sound:** the Bull, Bernúncia and Maricota are drawings in the app's style (`art.js`). The "Nhac!" and the festive tune are made on the phone with Web Audio: an original tune, no recordings. Sound only starts after a tap and stops when the screen changes; a phone on silent may play nothing. "Chomp!" ("Nhac!" in Portuguese) is always written on the screen too.
- **Spelling (Portuguese):** the spec spells it *Bernúncia* (*Bernunça* is also used). To change it in every Portuguese line, change `BERNUNCIA` at the top of the storyteller code in `game.js`.
- If `boi.json` doesn't load, the app runs with the space story only.
- Credit, shown on the choice screen, in Me and in "Where the stories come from": *Inspired by the traditional bull dance of Florianópolis and Santa Catarina.* (in Portuguese: *Inspirado na tradição do boi de mamão de Florianópolis e Santa Catarina.*)

Add `?demo` to the address to show the app without the scanner: Eagle pretends to scan (no camera needed), and demo progress is kept apart from real progress. On the Impact screen, demo mode shows sample data with a "Demo data" label: 1,284 pieces, or any total with `?demo&total=N`.

## Files

| File | What it is |
|---|---|
| `index.html`, `style.css`, `game.js` | The app: screens, the round, camera, read-aloud, and every word on screen in English, Spanish and Portuguese |
| `art.js` | The drawings as SVG: Eagle, the crew buddies, the 13 chapter patches, the bins, the finale map, the Impact milestones, tower and Earth-to-Moon strip |
| `impact.js` | The Impact screen's milestones (the spec's `MILESTONES`, unchanged) and maths: tower height, milestone passed and next, progress between them, the log-scale strip, and heights in each language's number format |
| `boi.json` | The Bull storyteller's lines in English and Portuguese, from the team's spec: the verse, the opening, the 13 chapter intros, Bernúncia's pick-up lines and the finale. Lines under `added` (the opening's title, the Bull's line on the find screen and on Home between pieces) are not in the spec |
| `content.json` | The story in English, Spanish and Portuguese: opening scene, 13 chapters, finale. English is the storyboard word for word. `links` are the storyboard's sources; `image` can hold a NASA picture per chapter |
| `docs/abandoned-but-not-forgotten-storyboard.md` | The team's storyboard, exported from the team's doc |
| `docs/screens-and-state.md` | The app as a state machine: what is saved, every screen and when it may open, and the rules the tests check |
| `fonts/` | Nunito (SIL Open Font License, `fonts/OFL.txt`), served by the app itself |
| `tests/` | The tests: see [`tests/README.md`](tests/README.md) |
| `img/chapters/` | NASA images for the chapters go here (e.g. `img/chapters/1.jpg`, then set `"image": "img/chapters/1.jpg"` in `content.json`). Until then each chapter shows its patch |
| `server.mjs` | The app as one Node server, for Railway or any host that runs `npm start`: serves the app's files (and nothing else from the repo) and the `/api` routes below, plus `GET /api/health`. Counters go in a file on a volume |
| `netlify/functions/scan.mjs` | `POST /api/scan` `{image, lang}`: sends the photo to Claude and answers in the player's language. The photo is never stored |
| `netlify/functions/pickup.mjs` | `POST /api/pickup` `{ticket}`: adds exactly 1 to the shared total for a confirmed pick-up. Each ticket counts once; sending it again answers 200 without counting |
| `netlify/functions/counter.mjs` | `GET /api/counter`: how many pieces of litter all players have confirmed in the bin |
| `netlify/lib/scanner.mjs` | The scanner (Claude Haiku with vision). Returns `is_trash` (yes / no / unsure), `type`, `bin`, `dangerous`, `item` (a short name, like "Plastic wrapper"), `message` and `photo_problem` |
| `netlify/lib/common.mjs` | Photo limits, storage (Netlify Blobs on Netlify; a JSON file or memory with `server.mjs`) and helpers |

## Privacy

- Photos are never saved: the phone shrinks them, the server sends them once to Claude and forgets them. The camera stops as soon as the child leaves the scan screen.
- No names, emails or personal data. The profile is a nickname and a crew buddy in `localStorage`.
- Progress, patches and the cleanup log (date and type of each piece) live on the phone.
- The app never asks for the phone's location, and talks to no other website: even the font is served by the app itself (no Google Fonts).
- The shared total only ever goes up by 1. A scan of litter that is safe to pick up returns a one-time ticket: a random number and an expiry (14 days), signed by the server, with nothing about the child, the place or the photo. The phone sends it back when the child confirms the pick-up, and keeps it until it can (offline is fine). The server remembers used tickets until they expire, so none counts twice.
- The server only keeps counters: pieces picked up, photos analysed per day, and used tickets (in Netlify Blobs, or in a small file on the Railway volume).
- Photos do leave the phone, once each, to be checked by the scanner (Claude). That is why the Impact spec's line "We never collect your location or upload your photos" is not shown. The per-player limit uses a sha256 of the IP and the day; the IP itself is never stored or logged.

## Bins

The game uses Colombia's colour code (Resolución 2184 de 2019): **white** for recyclables (clean plastic, cans, paper, cardboard, glass), **green** for food scraps, **black** for everything else. Batteries, electronics, chemicals and dangerous items go to a **special drop-off**, with an adult. For another country, change `BINS` and the prompt in `netlify/lib/scanner.mjs`, and the bin words in `game.js`.

## Deploy on Railway

Railway runs `server.mjs` (`npm start`, Node 22, both read from `package.json`).

1. **New Project → Deploy from GitHub repo**, and pick this repo. Railway builds it and deploys each push to `master`.
2. **Variables:** add `ANTHROPIC_API_KEY` (your Anthropic API key; it stays on the server). Optional: `PHOTOS_PER_DAY` (300) and `PHOTOS_PER_PLAYER_PER_DAY` (30) to protect the AI bill.
3. **Volume** (so the shared counter and the daily limits survive redeploys): add a volume to the service with mount path `/data`. The server finds it by itself through `RAILWAY_VOLUME_MOUNT_PATH`. Without a volume the app still works, but the counters start from zero after each deploy.
4. **Settings → Networking → Generate Domain** for the public address. Railway gives the app its port in `PORT`; the deploy log says `debris is running on port …`.
5. Optional: **Settings → Healthcheck path** `/api/health`.

## Run it on your computer

```bash
npm install
ANTHROPIC_API_KEY=… npm start
```

Then open http://localhost:3000 (or http://localhost:3000/?demo without a key).

## Deploy on Netlify (the other option)

1. Create a new Netlify site from this repo. The publish folder is the root (`netlify.toml` already says so).
2. In **Site configuration → Environment variables** add `ANTHROPIC_API_KEY` (secret, server only).
3. Optional: `PHOTOS_PER_DAY` (300) and `PHOTOS_PER_PLAYER_PER_DAY` (30) to protect the AI bill.

## Tested

- Server, with a fake Claude: Spanish and Portuguese answers, the new `item` field, a person in the photo (no name kept), sharp things marked dangerous, unknown language, AI failure, bad photo, per-player limit, scanner switched off, counter, and that the photo is never stored.
- Whole app in Chromium with a fake camera (phone 390 × 844, 320 × 640 in Spanish, desktop): onboarding, a full round, chapters 1, 2 and 13 checked against the storyboard, danger, retake, not litter, server error, save for later across a reload, jacket, cleanup log, Spanish and Portuguese, special drop-off, the finale and a 14th piece, no camera (file picker), demo mode with no server, the back button, no sideways scroll, and buttons at least 44 px.
- `server.mjs`: the app's files are served and everything else is hidden (server code, `node_modules`, `.git`, `..` tricks), the API routes, the 2 MB body limit, security headers, ETags (a file the phone already has comes back as "304 Not Modified"), and counters kept across a restart. The whole browser test above also passes behind it.
- Random walks through the app (`tests/monkey.cjs`): taps, Back, Forward, reloads, typed addresses, language and storyteller switches, checking the rules in `docs/screens-and-state.md` after every step.
- Audits: Lighthouse on the live site (mobile): Performance 98, Accessibility 100, Best Practices 100, SEO 100. axe-core (WCAG 2.1 AA) on every screen with both storytellers.
- Impact: the tower maths against the spec's examples and every boundary (0, 1, 5, 11, 12, 379, 380, 96/97, 1,284, Everest, the ISS, the Moon) and number formats; tickets on the server (one +1 per confirmed pick-up, a second phone sees it, replayed, simultaneous, forged and expired tickets don't count, dangerous finds get none); in the browser, the count-up, reduce-motion, the spec's lines in English, Portuguese and Spanish, the Moon line at 96/97, the Demo data label, `?total` ignored outside demo, an offline pick-up counted later, and no location requested.
- Bull storyteller, in the browser: the choice screen (Space Explorer chosen to start with), the Bull's opening in English, Portuguese and Spanish (English never says "Boi"), Bernúncia drawn like the reference picture (yellow, four black stripes, one eye, four legs, no green), the safety rules still before the first scan, a full round (find → bin → Bernúncia eats → the explorer wakes → the chapter with the Bull's line first), one ticket per pick-up counted once, the Back button showing Bernúncia settled with no second "Nhac!", the pick-up lines taking turns, Maricota in chapter 2, switching in Me keeping all progress, the finale and its Impact button, a 14th piece, reduce-motion, 320 px, and the facts of all 13 chapters identical with both storytellers in all three languages. Also: without `boi.json` the app runs with the space story, and a player from before lands on Home with the space story.
- **Not yet**: the real Claude key with real photos, and NASA pictures for the chapters.

## The 3D explorer jacket

The jacket screen shows a 3D jacket (`jacket3d.js` + `img/jacket.glb`). Every patch earned is stuck on it; a new one flies in and gets stamped on. Patches 1–6 go on the front, 7–8 on the sleeves and 9–13 on the back, and the child can drag the jacket to spin it. It loads only when the jacket screen opens. If a phone can't run 3D, the patch cards below work on their own.

- `src/jacket.blend`: the designer's model. `img/jacket.glb` is exported from it (jacket only, no patches, one level of smoothing).
- `src/jacket3d.src.js`: the code. `jacket3d.js` is built from it with three.js r160 (MIT licence):

```bash
npm install --no-save three@0.160.0 esbuild@0.21.5
```

```bash
npx esbuild src/jacket3d.src.js --bundle --minify --format=iife --target=es2019 --outfile=jacket3d.js
```
