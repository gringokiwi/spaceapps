# Tests

Run from the repository folder after `npm install`. The browser tests need Playwright and Chromium, which are kept out of `package.json` so the Railway build stays small: `npm install --no-save playwright` then `npx playwright install chromium`.

| Command | What it checks |
|---|---|
| `node tests/impact-test.cjs` | The Impact tower maths against the spec's examples and every boundary, and number formats |
| `node tests/server-test.mjs` | The server with a fake Claude: languages, dangerous finds, limits, pick-up tickets counted once, nothing stored about the child |
| `node tests/e2e.cjs` | The whole app in Chromium with a fake camera and a mock server: both storytellers, three languages, 320 px, reduced motion, demo mode, layout and 44 px touch targets, no requests to other sites |
| `BASE_URL=http://127.0.0.1:3000/ node tests/e2e.cjs` | The same, against a running `npm start`, so the server's security headers apply |
| `node tests/monkey.cjs [seeds] [steps]` | Random walks (taps, Back, Forward, reload, typed addresses, language and storyteller switches) checking the rules in `docs/screens-and-state.md` after every step |
| `node tests/axe.cjs` | Accessibility (axe-core, WCAG 2.1 AA) on every screen with both storytellers. Needs `npm install --no-save axe-core` |
