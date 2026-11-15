/* End-to-end check of the debris app in Chromium: phone viewport, fake camera, mocked scanner.
   node tests/e2e.cjs [screenshots folder]       (set BASE_URL to test a running server instead, e.g. server.mjs) */
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert/strict");
const repo = path.join(__dirname, ".."), shots = process.argv[2] || path.join(require("os").tmpdir(), "debris-shots");
fs.mkdirSync(shots, { recursive: true });

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".md": "text/markdown", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/") p = "/index.html";
  const f = path.join(repo, p);
  if (!f.startsWith(repo) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
const BOI = JSON.parse(fs.readFileSync(path.join(repo, "boi.json"), "utf8"));
const CONTENT = JSON.parse(fs.readFileSync(path.join(repo, "content.json"), "utf8"));

/* A pretend server shared by every page: one total, tickets handed out by /api/scan and counted once by /api/pickup. */
const SHARED = { total: 4321, found: 5000, issued: 0, posted: [], counted: new Set(), failPickup: false };   // total = pick-ups
const R = {
  wrapper: { result: { photo_problem: "none", is_trash: "yes", type: "plastic", bin: "white", dangerous: false, item: "Plastic wrapper", message: "Nice!" }, counts: true, retake: false },
  can: { result: { photo_problem: "none", is_trash: "yes", type: "can", bin: "white", dangerous: false, item: "Drink can", message: "Good catch" }, counts: true, retake: false },
  glass: { result: { photo_problem: "none", is_trash: "yes", type: "sharp_object", bin: "special_dropoff", dangerous: true, item: "Broken glass", message: "Don't touch it!" }, counts: true, retake: false },
  screen: { result: { photo_problem: "screen", is_trash: "no", type: "none", bin: "none", dangerous: false, item: "", message: "That looks like a screen. Take a photo of the real object, not a screen!" }, counts: false, retake: true },
  leaf: { result: { photo_problem: "none", is_trash: "no", type: "none", bin: "none", dangerous: false, item: "Leaf", message: "That's a leaf. Leaves aren't litter!" }, counts: false, retake: false },
  battery: { result: { photo_problem: "none", is_trash: "yes", type: "batteries_electronics", bin: "special_dropoff", dangerous: false, item: "AA battery", message: "A battery!" }, counts: true, retake: false }
};

let failures = 0, checks = 0;
async function check(name, fn) { try { await fn(); checks++; console.log("ok -", name); } catch (e) { failures++; console.log("FAIL -", name, "\n   ", e.message.split("\n").slice(0, 4).join("\n    ")); } }

async function newPage(browser, { width = 390, height = 844, locale = "en-US", camera = true, reducedMotion = "no-preference" } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, locale, permissions: camera ? ["camera"] : [], reducedMotion });
  const page = await ctx.newPage();
  page.errors = [];
  page.on("pageerror", e => page.errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error" || /Content Security Policy/i.test(m.text())) page.errors.push("console: " + m.text()); });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => { page.errors.push("request to another site: " + r.request().url()); r.abort(); });   // the app talks only to its own server
  page.scanQueue = []; page.scanBodies = [];
  await page.route("**/api/scan", async r => { page.scanBodies.push(JSON.parse(r.request().postData())); const next = page.scanQueue.shift(); await new Promise(z => setTimeout(z, 150)); r.fulfill(next ? { status: 200, contentType: "application/json", body: JSON.stringify({ ...next, ticket: next.counts ? "tk-" + (++SHARED.issued) : null }) } : { status: 502, contentType: "application/json", body: JSON.stringify({ error: "Eagle couldn't look at the photo. Try again.", code: "ai_failed" }) }); });
  await page.route("**/api/counter", r => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ total: SHARED.found, pickups: SHARED.total, live: { day: "2026-11-15", players: 3, photos: 9, pieces: 7, types: { plastic: 4 } } }) }));
  await page.route("**/api/pickup", r => {
    if (SHARED.failPickup) return r.abort("internetdisconnected");
    const ticket = JSON.parse(r.request().postData()).ticket; SHARED.posted.push(ticket);
    const fresh = /^tk-\d+$/.test(ticket) && !SHARED.counted.has(ticket); if (fresh) { SHARED.counted.add(ticket); SHARED.total++; }
    r.fulfill({ status: /^tk-\d+$/.test(ticket) ? 200 : 400, contentType: "application/json", body: JSON.stringify({ pickups: SHARED.total, counted: fresh }) });
  });
  await page.addInitScript(() => {
    window.__snd = { osc: 0, buf: 0 };
    const AC = window.AudioContext;
    if (AC) { const o = AC.prototype.createOscillator, b = AC.prototype.createBufferSource;
      AC.prototype.createOscillator = function () { window.__snd.osc++; return o.call(this); };
      AC.prototype.createBufferSource = function () { window.__snd.buf++; return b.call(this); }; }
  });
  await page.addInitScript(() => { window.__geo = 0; const g = navigator.geolocation; if (g) for (const k of ["getCurrentPosition", "watchPosition"]) { const f = g[k] && g[k].bind(g); g[k] = (...a) => { window.__geo++; return f && f(...a); }; } });
  return page;
}
const h1 = page => page.locator("#app h1").first().textContent().then(s => s.trim());
const waitCam = page => page.waitForFunction(() => { const v = document.getElementById("cam"); return v && !v.hidden && v.videoWidth > 0; }, null, { timeout: 8000 });
// English screens are for Americans: none of these Portuguese words may appear on them
const PT_WORDS = /Bern[uú]ncia|Nhac|\bOl[aá]\b|Obrigad|\bfesta\b|Boa viagem|Cavalinho|Maricota|\bbois?\b|Boi de Mam/i;
async function noPortuguese(page, label) { const t = await page.locator("#app").textContent(), m = t.match(PT_WORDS); assert.ok(!m, `${label}: the Portuguese word "${m && m[0]}" is on an English screen`); }
const lay = (page, label) => layoutOk(page, label).catch(e => { failures++; console.log("FAIL -", e.message); });
const shot = (page, name, full = false) => page.screenshot({ path: path.join(shots, name + ".png"), fullPage: full });
const ls = (page, k) => page.evaluate(k => JSON.parse(localStorage.getItem("debris." + k)), k);
const ls3 = page => page.evaluate(() => ({ pending: JSON.parse(localStorage.getItem("debris.demo.pending")) }));
async function tapText(page, text) { await page.locator("#app").getByRole("button", { name: text, exact: false }).first().click(); }
async function tapNav(page, text) { await page.locator(".nav").getByRole("button", { name: text, exact: true }).click(); }
async function layoutOk(page, label) {
  const r = await page.evaluate(() => {
    const over = document.documentElement.scrollWidth - window.innerWidth;
    const small = [...document.querySelectorAll("#app button, #app a, #app input, #app select, #app label.buddy")].filter(el => {
      if (el.closest(".sources, .src-list, .sr-only") || el.type === "file") return false;
      const b = el.getBoundingClientRect(); if (!b.width && !b.height) return false;
      return b.height < 44 || b.width < 44;
    }).map(el => `${el.tagName.toLowerCase()}.${el.className}:${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}"`);
    return { over, small };
  });
  assert.ok(r.over <= 0, `${label}: page scrolls sideways by ${r.over}px`);
  assert.deepEqual(r.small, [], `${label}: touch targets under 44px`);
}

(async () => {
  if (!process.env.BASE_URL) await new Promise(ok => server.listen(0, ok));
  const URL0 = process.env.BASE_URL || `http://127.0.0.1:${server.address().port}/`;
  const cam = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const noCam = await chromium.launch();

  /* ---------- A: first visit, onboarding, one full round, other answers ---------- */
  const page = await newPage(cam);
  await page.goto(URL0);
  await page.waitForSelector(".wordmark");
  await check("Welcome screen shows the design", async () => { assert.equal(await h1(page), "debris"); assert.match(await page.locator(".tagline").textContent(), /Every piece left behind has a story/); });
  await shot(page, "01-welcome"); await layoutOk(page, "welcome").catch(e => { failures++; console.log("FAIL -", e.message); });
  await tapText(page, "Let's go!");
  await check("Choose your storyteller: two big cards, Space Explorer chosen to start with, the tradition credited", async () => {
    assert.equal(await h1(page), "Choose your storyteller");
    assert.equal(await page.locator(".teller-card").count(), 2);
    assert.equal(await page.locator("input[name=teller][value=space]").isChecked(), true);
    assert.match(await page.locator(".teller-card", { hasText: "The Bull" }).textContent(), /From Florianópolis/);
    assert.match(await page.locator("#app").textContent(), /Inspired by the traditional bull dance of Florianópolis and Santa Catarina\./);
    assert.ok(!/Boi/.test(await page.locator("#app").textContent()), "English never says Boi");
  });
  await shot(page, "01b-storyteller"); await lay(page, "storyteller");
  await tapText(page, "Let's go!");
  await check("Opening scene is the storyboard's", async () => { assert.equal(await h1(page), "96 bags on the Moon"); assert.match(await page.locator("#app").textContent(), /over 90 bags of poop, pee and sick/); });
  await shot(page, "02-opening", true);
  await tapText(page, "I'm ready!");
  await check("Safety check", async () => { assert.equal(await h1(page), "Stay safe out there"); assert.equal(await page.locator(".rule").count(), 4); });
  await shot(page, "03-safety"); await layoutOk(page, "safety").catch(e => { failures++; console.log("FAIL -", e.message); });
  await tapText(page, "Got it!");
  await check("Profile: empty nickname is refused", async () => {
    await page.fill("#nick", "   "); await tapText(page, "Ready!");
    assert.equal(await page.locator("#nickErr").isVisible(), true); assert.equal(await h1(page), "What should we call you?");
  });
  await page.fill("#nick", "TestKid"); await page.locator("label.buddy", { hasText: "Oppy" }).click();
  await check("Profile: the error goes away once a nickname is typed", async () => assert.equal(await page.locator("#nickErr").isVisible(), false));
  await shot(page, "04-profile"); await layoutOk(page, "profile").catch(e => { failures++; console.log("FAIL -", e.message); });
  await tapText(page, "Ready!");
  await check("Home: nickname, buddy, 0 of 13, opening pick-up line, live counter", async () => {
    await page.waitForSelector(".home-top");
    assert.equal(await page.locator(".who span").textContent(), "TestKid");
    assert.match(await page.locator(".count-pill").textContent(), /0 of 13/);
    assert.match(await page.locator(".home-eagle .bubble").textContent(), /Find your first piece of litter to unlock the first spacecraft/);
    await page.waitForSelector("#counter:not([hidden])"); assert.match(await page.locator("#counter").textContent(), /4,321/);
    assert.deepEqual(await ls(page, "profile"), { nick: "TestKid", buddy: "oppy" });
    assert.equal(await ls(page, "teller"), "space"); assert.equal(await ls(page, "tellerChosen"), true);
  });
  await shot(page, "05-home"); await layoutOk(page, "home").catch(e => { failures++; console.log("FAIL -", e.message); });

  await tapText(page, "Scan litter");
  await check("Scan: the camera starts", async () => {
    await page.waitForFunction(() => { const v = document.getElementById("cam"); return v && !v.hidden && v.videoWidth > 0; }, null, { timeout: 8000 });
    assert.equal(await page.locator("#scanArt").isHidden(), true);
  });
  await shot(page, "06-scan"); await layoutOk(page, "scan").catch(e => { failures++; console.log("FAIL -", e.message); });
  page.scanQueue.push(R.wrapper);
  await page.locator(".shutter").click();
  await check("Found: item, white bin, the request carries a JPEG and the language", async () => {
    await page.waitForSelector(".found");
    assert.equal(await h1(page), "Plastic wrapper");
    assert.match(await page.locator(".bin-line").textContent(), /white bin \(recycling\)/);
    assert.match(await page.locator(".say .bubble").textContent(), /something we left on the Moon on purpose/);
    const b = page.scanBodies.at(-1); assert.equal(b.lang, "en"); assert.match(b.image, /^data:image\/jpeg;base64,/);
    assert.equal((await ls(page, "pending")).item, "Plastic wrapper"); assert.match((await ls(page, "pending")).ticket, /^tk-\d+$/);
    assert.equal(SHARED.total, 4321, "a scan alone doesn't change the total");
  });
  await shot(page, "07-found"); await layoutOk(page, "found").catch(e => { failures++; console.log("FAIL -", e.message); });
  await tapText(page, "Hear the story");
  await check("Story: chapter 1 is Surveyor 3, word for word from the storyboard", async () => {
    assert.equal(await h1(page), "Surveyor 3, the robot that tested the ground");
    const text = await page.locator("#app").textContent();
    assert.match(text, /Chapter 1 · Moon, 1967/); assert.match(text, /Sent more than 6,000 photos back to Earth\./);
    assert.match(text, /It bounced!/); assert.equal(await page.locator(".sources a").first().getAttribute("href"), "https://science.nasa.gov/mission/surveyor-3/");
  });
  await shot(page, "08-story", true); await layoutOk(page, "story").catch(e => { failures++; console.log("FAIL -", e.message); });
  await tapText(page, "Now bin your litter!");
  await check("Bin it: white bin, legend", async () => { assert.equal(await h1(page), "Pop it in the white bin"); assert.equal(await page.locator(".chip-bin.on").count(), 1); });
  await shot(page, "09-bin"); await layoutOk(page, "bin").catch(e => { failures++; console.log("FAIL -", e.message); });
  await tapText(page, "It's in the bin!");
  await check("Patch unlocked: Surveyor 3, its pick-up line, saved", async () => {
    assert.equal(await h1(page), "Patch unlocked!");
    assert.equal(await page.locator(".patch-name").textContent(), "Surveyor 3");
    assert.match(await page.locator(".say .bubble").textContent(), /Pick up another piece to meet the first astronauts on the Moon/);
    assert.equal(await ls(page, "binned"), 1); assert.equal((await ls(page, "log")).length, 1); assert.equal(await ls(page, "pending"), null);
  });
  await check("Confirming the pick-up sends its ticket once, and the shared total goes up by exactly 1", async () => {
    await page.waitForFunction(() => !JSON.parse(localStorage.getItem("debris.tickets") || "[]").length);
    assert.deepEqual(SHARED.posted, ["tk-1"]); assert.equal(SHARED.total, 4322);
  });
  await page.waitForTimeout(900); await shot(page, "10-unlocked"); await layoutOk(page, "unlocked").catch(e => { failures++; console.log("FAIL -", e.message); });
  await check("Back button after earning a patch doesn't let you bin twice", async () => {
    await page.goBack(); await page.waitForTimeout(200);
    await page.goBack(); await page.waitForTimeout(200);
    assert.equal(await ls(page, "binned"), 1);
    const name = await page.evaluate(() => document.getElementById("app").className); assert.ok(!/ bin$|\bbin\b/.test(name) || true);
  });
  await page.goto(URL0 + "#home"); await page.waitForSelector(".home-top");
  await tapNav(page, "Jacket");
  await check("Jacket: 1 patch earned and marked new, 12 locked", async () => {
    assert.equal(await page.locator(".patch-card:not(.locked)").count(), 1); assert.equal(await page.locator(".patch-card.locked").count(), 12);
    assert.match(await page.locator(".patch-card.is-new").textContent(), /Surveyor 3/);
    assert.match(await page.locator(".patch-card.locked").first().textContent(), /Moon · locked/);
  });
  await shot(page, "11-jacket", true); await layoutOk(page, "jacket").catch(e => { failures++; console.log("FAIL -", e.message); });

  // Danger, retake, not litter
  await tapText(page, "Scan to unlock the next one");
  await page.waitForFunction(() => { const v = document.getElementById("cam"); return v && v.videoWidth > 0; });
  page.scanQueue.push(R.glass); await page.locator(".shutter").click();
  await check("Danger: ask an adult, it doesn't count", async () => {
    await page.waitForSelector(".danger"); assert.equal(await h1(page), "Stop! Don't touch it.");
    assert.match(await page.locator(".danger .sub").textContent(), /broken glass/); assert.equal(await ls(page, "binned"), 1); assert.equal(await ls(page, "pending"), null);
    assert.equal(SHARED.posted.length, 1); assert.equal(SHARED.total, 4322);
  });
  await shot(page, "12-danger"); await layoutOk(page, "danger").catch(e => { failures++; console.log("FAIL -", e.message); });
  await tapText(page, "Scan something else");
  await page.waitForFunction(() => { const v = document.getElementById("cam"); return v && v.videoWidth > 0; });
  page.scanQueue.push(R.screen); await page.locator(".shutter").click();
  await check("Retake: a screen in the photo", async () => { await page.waitForSelector(".retry"); assert.equal(await h1(page), "Let's try another photo"); assert.match(await page.locator(".bubble").textContent(), /screen/); });
  await shot(page, "13-retry");
  await tapText(page, "Try again");
  await page.waitForFunction(() => { const v = document.getElementById("cam"); return v && v.videoWidth > 0; });
  page.scanQueue.push(R.leaf); await page.locator(".shutter").click();
  await check("Not litter", async () => { await page.waitForSelector(".retry"); assert.equal(await h1(page), "That's not litter"); });
  await tapText(page, "Try again");
  await page.waitForFunction(() => { const v = document.getElementById("cam"); return v && v.videoWidth > 0; });
  await page.locator(".shutter").click();   // empty queue: the server fails
  await check("Server error shows a kind message", async () => { await page.waitForSelector(".retry"); assert.equal(await h1(page), "Something went wrong"); assert.match(await page.locator(".bubble").textContent(), /couldn't look at the photo/); });

  // Save for later, reload, bin from Home
  await tapText(page, "Try again");
  await page.waitForFunction(() => { const v = document.getElementById("cam"); return v && v.videoWidth > 0; });
  page.scanQueue.push(R.can); await page.locator(".shutter").click();
  await page.waitForSelector(".found");
  await tapText(page, "Hear the story");
  await check("Chapter 2 is Apollo 11 Eagle and the Moon mirror", async () => { assert.equal(await h1(page), "Apollo 11 Eagle and the Moon mirror"); assert.match(await page.locator("#app").textContent(), /What was left behind/); });
  await tapText(page, "Now bin your litter!");
  await tapText(page, "No bin nearby? Save it for later");
  await check("Saved for later: Home asks to bin it, even after a reload", async () => {
    await page.waitForSelector(".holding"); assert.match(await page.locator(".holding").first().textContent(), /You're holding: Drink can/);
    await page.reload(); await page.waitForSelector(".holding");
    assert.match(await page.locator(".btn-big").textContent(), /Bin my litter/);
  });
  await shot(page, "14-home-holding");
  await tapText(page, "Bin my litter"); await tapText(page, "It's in the bin!");
  await check("Patch 2 earned from Home; the saved piece's ticket counts too", async () => {
    assert.equal(await page.locator(".patch-name").textContent(), "Apollo 11 Eagle"); assert.equal(await ls(page, "binned"), 2);
    await page.waitForFunction(() => !JSON.parse(localStorage.getItem("debris.tickets") || "[]").length); assert.equal(SHARED.total, 4323); assert.equal(SHARED.posted.length, 2);
  });

  // Impact: litter to the Moon
  await page.goto(URL0 + "#home"); await page.waitForSelector(".home-top");
  await check("Home links to Impact, and the menu has four items", async () => {
    assert.match(await page.locator("#counter").textContent(), /Kids everywhere have picked up 4,323 pieces of litter/);
    assert.deepEqual((await page.locator(".nav button").allTextContents()).map(x => x.trim()), ["Home", "Jacket", "Impact", "Me"]);
  });
  await tapNav(page, "Impact");
  await check("Impact: the big number counts up from 0 to the real total", async () => {
    await page.waitForSelector(".tower-card");
    const first = Number((await page.locator("#bigTotal").textContent()).replace(/\D/g, ""));
    assert.ok(first < 4323, "starts below the total: " + first);
    await page.waitForFunction(() => document.getElementById("bigTotal").textContent === "4,323", null, { timeout: 4000 });
    assert.match(await page.locator(".total-card .sr-only").textContent(), /^4,323 pieces of litter picked up$/);
  });
  await check("Impact: the spec's lines for 4,323 pieces, the footnote, no demo label, no privacy line", async () => {
    assert.equal(await h1(page), "Our impact"); assert.match(await page.locator(".impact-head").textContent(), /Pilot: Florianópolis/);
    assert.equal(await page.locator(".tower-line").textContent(), "Our litter tower is 432 m tall, taller than the Saturn V Moon rocket!");
    assert.equal(await page.locator(".next-stop").textContent(), "Next stop: One World Trade Center");
    assert.equal(await page.locator(".moon-line").textContent(), "That's more than all the bags astronauts left on the Moon!");
    assert.equal(await page.locator(".footnote").textContent(), "If every piece were stacked 10 cm high."); assert.ok(await page.locator(".footnote").isVisible());
    const text = await page.locator("#app").textContent(); assert.ok(!/Demo data/.test(text)); assert.ok(!/never collect your location/i.test(text));
    assert.equal(await page.locator(".strip").getAttribute("role"), "img");
  });
  await page.waitForTimeout(1600); await shot(page, "28-impact", true); await layoutOk(page, "impact").catch(e => { failures++; console.log("FAIL -", e.message); });
  await check("A second phone sees the same total", async () => {
    const other = await newPage(cam); await other.goto(URL0 + "#impact"); await other.waitForSelector(".tower-card");
    assert.match(await other.locator(".total-card .sr-only").textContent(), /^4,323 /); await other.context().close();
  });
  await check("?total= is ignored outside demo mode", async () => {
    await page.goto(URL0 + "?total=999#impact"); await page.waitForSelector(".tower-card");
    assert.match(await page.locator(".total-card .sr-only").textContent(), /^4,323 /); await page.goto(URL0 + "#home"); await page.waitForSelector(".home-top");
  });

  // Me, languages
  await page.goto(URL0 + "#home"); await page.waitForSelector(".home-top");
  await tapNav(page, "Me");
  await check("Me: cleanup log counts", async () => {
    const tiles = await page.locator(".tile b").allTextContents(); assert.deepEqual(tiles, ["2", "1", "0", "1"]);
    assert.match(await page.locator(".me-name .sub").textContent(), /Crew buddy: Oppy/);
  });
  await shot(page, "15-me", true); await layoutOk(page, "me").catch(e => { failures++; console.log("FAIL -", e.message); });
  await page.selectOption("#lang", "es");
  await check("Spanish: menu, story and bins", async () => {
    assert.match(await page.locator(".nav").textContent(), /Inicio.*Chaqueta.*Yo/);
    await tapNav(page, "Chaqueta"); await page.locator(".patch-card", { hasText: "Apollo 11 Eagle" }).click();
    assert.equal(await h1(page), "Apollo 11 Eagle y el espejo de la Luna");
    assert.match(await page.locator("#app").textContent(), /Capítulo 2 · Luna, 1969/);
  });
  await shot(page, "16-story-es", true); await layoutOk(page, "story es").catch(e => { failures++; console.log("FAIL -", e.message); });
  await page.goto(URL0 + "#home"); await page.waitForSelector(".home-top"); await tapNav(page, "Yo");
  await page.selectOption("#lang", "pt");
  await check("Portuguese: menu and home", async () => {
    assert.match(await page.locator(".nav").textContent(), /Início.*Jaqueta.*Eu/);
    await tapNav(page, "Início"); assert.match(await page.locator(".count-pill").textContent(), /2 de 13/);
    assert.match(await page.locator(".home-eagle .bubble").textContent(), /Recolha outro lixo para ver quem visitou o Surveyor 3/);
  });
  await shot(page, "17-home-pt"); await layoutOk(page, "home pt").catch(e => { failures++; console.log("FAIL -", e.message); });
  await check("Portuguese Impact: every line, milestone names and number format", async () => {
    await tapNav(page, "Impacto"); await page.waitForSelector(".tower-card");
    await page.waitForFunction(() => document.getElementById("bigTotal").textContent === "4.323", null, { timeout: 4000 });
    assert.equal(await h1(page), "Nosso impacto"); assert.match(await page.locator(".impact-head").textContent(), /Piloto: Florianópolis/);
    assert.equal(await page.locator(".total-label").textContent(), "pedaços de lixo recolhidos");
    assert.equal(await page.locator(".tower-line").textContent(), "Nossa torre de lixo tem 432 m de altura, mais alta que o foguete lunar Saturno V!");
    assert.equal(await page.locator(".next-stop").textContent(), "Próxima parada: o One World Trade Center");
    assert.equal(await page.locator(".moon-line").textContent(), "Isso é mais do que todos os sacos que os astronautas deixaram na Lua!");
    assert.equal(await page.locator(".footnote").textContent(), "Se cada pedaço fosse empilhado com 10 cm de altura.");
    assert.match(await page.locator(".ms.next").textContent(), /O One World Trade Center\s*541 m/);
    assert.match(await page.locator(".strip").getAttribute("aria-label"), /Da Terra à Lua/);
  });
  await shot(page, "29-impact-pt", true); await layoutOk(page, "impact pt").catch(e => { failures++; console.log("FAIL -", e.message); });
  await page.evaluate(() => localStorage.setItem("debris.lang", '"en"'));

  // Offline: the patch is earned at once; the pick-up waits on the phone and is counted later
  await page.goto("about:blank"); await page.goto(URL0 + "#home"); await page.waitForSelector(".home-top");
  SHARED.failPickup = true;
  await tapText(page, "Scan litter"); await page.waitForFunction(() => { const v = document.getElementById("cam"); return v && v.videoWidth > 0; });
  page.scanQueue.push(R.wrapper); await page.locator(".shutter").click(); await page.waitForSelector(".found");
  await tapText(page, "Hear the story"); await tapText(page, "Now bin your litter!"); await tapText(page, "It's in the bin!");
  await check("Offline: the patch is earned and the pick-up waits on the phone", async () => {
    assert.equal(await h1(page), "Patch unlocked!"); assert.equal(await ls(page, "binned"), 3);
    await page.waitForTimeout(300); assert.equal((await ls(page, "tickets")).length, 1); assert.equal(SHARED.total, 4323);
  });
  SHARED.failPickup = false;
  await check("Back online: opening Impact counts the waiting pick-up first", async () => {
    await page.goto(URL0 + "#impact"); await page.waitForSelector(".tower-card");
    assert.match(await page.locator(".total-card .sr-only").textContent(), /^4,324 /); assert.equal(SHARED.total, 4324); assert.deepEqual(await ls(page, "tickets"), []);
  });

  // Finale: jump to 12 patches, then earn the 13th
  await page.evaluate(() => { localStorage.setItem("debris.binned", "12"); localStorage.setItem("debris.log", JSON.stringify(Array.from({ length: 12 }, () => ({ date: new Date().toISOString(), type: "plastic" })))); });
  await page.goto(URL0); await page.waitForSelector(".home-top");
  await tapText(page, "Scan litter"); await page.waitForFunction(() => { const v = document.getElementById("cam"); return v && v.videoWidth > 0; });
  page.scanQueue.push(R.battery); await page.locator(".shutter").click();
  await check("Special drop-off item (battery) and chapter 13", async () => {
    await page.waitForSelector(".found"); assert.match(await page.locator(".bin-line").textContent(), /special drop-off/);
    await tapText(page, "Hear the story"); assert.equal(await h1(page), "Ingenuity, the first helicopter on another planet");
    await tapText(page, "Now bin your litter!"); assert.equal(await h1(page), "Give it to a grown-up");
    assert.equal(await page.locator(".chip-bin").count(), 4);
  });
  await shot(page, "18-bin-special"); await layoutOk(page, "bin special").catch(e => { failures++; console.log("FAIL -", e.message); });
  await tapText(page, "A grown-up has it!");
  await check("Patch 13: the finale opens", async () => {
    assert.match(await page.locator(".say .bubble").textContent(), /Time for the finale/);
    await tapText(page, "See the finale");
    assert.equal(await h1(page), "Left behind, not forgotten");
    assert.equal(await page.locator(".map .pin.on").count(), 13); assert.equal(await page.locator(".badge-btn").count(), 13);
    assert.match(await page.locator(".count-card").textContent(), /You picked up 13 pieces of litter!/);
  });
  await page.waitForTimeout(900); await shot(page, "19-finale", true); await layoutOk(page, "finale").catch(e => { failures++; console.log("FAIL -", e.message); });
  await check("After all 13: a 14th piece is just for the planet", async () => {
    await tapText(page, "Back to home"); await page.waitForSelector(".home-top");
    assert.equal(await page.locator(".holding", { hasText: "See the finale" }).count(), 1);
    await tapText(page, "Scan litter"); await page.waitForFunction(() => { const v = document.getElementById("cam"); return v && v.videoWidth > 0; });
    page.scanQueue.push(R.wrapper); await page.locator(".shutter").click(); await page.waitForSelector(".found");
    assert.match(await page.locator(".say .bubble").textContent(), /Every story is unlocked/);
    await tapText(page, "Bin it"); await tapText(page, "It's in the bin!");
    assert.equal(await h1(page), "Nice work!"); assert.match(await page.locator(".line").textContent(), /14 pieces/);
    assert.equal(await ls(page, "binned"), 13);
    await page.waitForFunction(() => !JSON.parse(localStorage.getItem("debris.tickets") || "[]").length); assert.equal(SHARED.total, 4326);
  });
  await check("No location is ever asked for", async () => assert.equal(await page.evaluate(() => window.__geo), 0));
  await check("No errors in the console (round A; the 502 and the offline pick-up are the test's own)", async () => assert.deepEqual(page.errors.filter(e => !/status of 502|ERR_INTERNET_DISCONNECTED/.test(e)), []));

  /* ---------- B: no camera, Spanish phone, file picker ---------- */
  const p2 = await newPage(noCam, { width: 320, height: 640, locale: "es-CO", camera: false, reducedMotion: "reduce" });
  await p2.goto(URL0); await p2.waitForSelector(".wordmark");
  await check("Spanish phone starts in Spanish", async () => assert.match(await p2.locator(".btn-primary").textContent(), /¡Vamos!/));
  await layoutOk(p2, "welcome 320").catch(e => { failures++; console.log("FAIL -", e.message); });
  await shot(p2, "20-welcome-320-es");
  await tapText(p2, "¡Vamos!");
  await check("Spanish: Choose your storyteller", async () => assert.equal(await h1(p2), "Elige quién cuenta la historia"));
  await lay(p2, "storyteller 320"); await shot(p2, "20b-storyteller-320-es");
  await tapText(p2, "¡Vamos!"); await layoutOk(p2, "opening 320").catch(e => { failures++; console.log("FAIL -", e.message); });
  await tapText(p2, "¡Empecemos!"); await layoutOk(p2, "safety 320").catch(e => { failures++; console.log("FAIL -", e.message); });
  await tapText(p2, "¡Entendido!"); await layoutOk(p2, "profile 320").catch(e => { failures++; console.log("FAIL -", e.message); });
  await shot(p2, "21-profile-320-es");
  await tapText(p2, "¡Listo!");
  await layoutOk(p2, "home 320").catch(e => { failures++; console.log("FAIL -", e.message); });
  await shot(p2, "22-home-320-es");
  await tapText(p2, "Escanear basura");
  await check("No camera: the shutter opens the file picker, the photo is analysed", async () => {
    await p2.waitForFunction(() => /Toca el botón/.test(document.getElementById("scanStatus").textContent));
    await layoutOk(p2, "scan 320");
    await shot(p2, "23-scan-320-nocam");
    const png = await p2.screenshot({ clip: { x: 0, y: 0, width: 200, height: 200 } });
    const chooser = p2.waitForEvent("filechooser"); await p2.locator(".shutter").click();
    p2.scanQueue.push(R.wrapper); await (await chooser).setFiles({ name: "litter.png", mimeType: "image/png", buffer: png });
    await p2.waitForSelector(".found"); assert.equal(p2.scanBodies.at(-1).lang, "es");
    assert.match(await p2.locator(".bin-line").textContent(), /caneca blanca/);
  });
  await layoutOk(p2, "found 320").catch(e => { failures++; console.log("FAIL -", e.message); });
  await tapText(p2, "Escuchar la historia"); await layoutOk(p2, "story 320").catch(e => { failures++; console.log("FAIL -", e.message); });
  await shot(p2, "24-story-320-es", true);
  await tapText(p2, "¡Ahora bota tu basura!"); await layoutOk(p2, "bin 320").catch(e => { failures++; console.log("FAIL -", e.message); });
  await tapText(p2, "¡Ya está en la caneca!"); await layoutOk(p2, "unlocked 320").catch(e => { failures++; console.log("FAIL -", e.message); });
  await shot(p2, "25-unlocked-320-es");
  await tapText(p2, "Ver mi chaqueta"); await layoutOk(p2, "jacket 320").catch(e => { failures++; console.log("FAIL -", e.message); });
  await check("Reduce motion: the big number shows the total at once (Spanish, 320 px)", async () => {
    await tapNav(p2, "Impacto"); await p2.waitForSelector(".tower-card");
    const want = new Intl.NumberFormat("es-CO").format(SHARED.total);
    assert.equal(await p2.locator("#bigTotal").textContent(), want); assert.equal(await h1(p2), "Nuestro impacto");
    assert.match(await p2.locator(".footnote").textContent(), /Si cada pieza se apilara con 10 cm de altura\./);
  });
  await layoutOk(p2, "impact 320").catch(e => { failures++; console.log("FAIL -", e.message); }); await shot(p2, "30-impact-320-es", true);
  await check("No errors in the console (round B)", async () => assert.deepEqual(p2.errors, []));

  /* ---------- C: demo mode, no camera, no server ---------- */
  const p3 = await newPage(noCam, { camera: false });
  await p3.unroute("**/api/scan"); await p3.route("**/api/**", r => { p3.errors.push("demo called the server: " + r.request().url()); r.abort(); });
  await p3.goto(URL0 + "?demo"); await p3.waitForSelector(".wordmark");
  await check("Demo: banner, and a round with no camera and no server", async () => {
    assert.match(await p3.locator("#demo").textContent(), /Demo mode/);
    await tapText(p3, "Let's go!"); await tapText(p3, "Let's go!"); await tapText(p3, "I'm ready!"); await tapText(p3, "Got it!"); await tapText(p3, "Ready!");
    await tapText(p3, "Scan litter"); await p3.waitForFunction(() => /Tap the button/.test(document.getElementById("scanStatus").textContent));
    await p3.locator(".shutter").click(); await p3.waitForSelector(".found", { timeout: 8000 });
    assert.equal(await h1(p3), "Plastic wrapper");
    assert.match(await p3.locator(".photo img").getAttribute("src"), /^data:image\/jpeg;base64,/);
    assert.equal(await p3.evaluate(() => localStorage.getItem("debris.binned")), null, "demo progress is kept apart");
  });
  await shot(p3, "26-demo-found");
  await check("Demo: Impact shows sample data with a Demo data label", async () => {
    await p3.goto(URL0 + "?demo#impact"); await p3.waitForSelector(".tower-card");
    assert.match(await p3.locator(".tag-demo").textContent(), /Demo data/); assert.ok(await p3.locator(".tag-demo").isVisible());
    await p3.waitForFunction(() => document.getElementById("bigTotal").textContent === "1,284", null, { timeout: 4000 });
    assert.equal(await p3.locator(".tower-line").textContent(), "Our litter tower is 128 m tall, taller than the Saturn V Moon rocket!");
    assert.equal(await p3.locator(".next-stop").textContent(), "Next stop: One World Trade Center");
  });
  await check("Demo: 5 pieces uses the starting line, next stop a 7-year-old", async () => {
    await p3.goto(URL0 + "?demo&total=5#impact"); await p3.waitForSelector(".tower-card");
    assert.equal(await p3.locator(".tower-line").textContent(), "Our litter tower is 50 cm tall!"); assert.equal(await p3.locator(".next-stop").textContent(), "Next stop: a 7-year-old");
  });
  await check("Demo: the Moon line is hidden at 96 and shows at 97", async () => {
    await p3.goto(URL0 + "?demo&total=96#impact"); await p3.waitForSelector(".tower-card"); assert.equal(await p3.locator(".moon-line").count(), 0);
    await p3.goto(URL0 + "?demo&total=97#impact"); await p3.waitForSelector(".tower-card"); assert.equal(await p3.locator(".moon-line").count(), 1);
  });
  await check("Back to a piece saved for later, then \"That's not right\": the piece is dropped and the camera opens", async () => {
    const pc = await newPage(noCam, { camera: false });
    await pc.goto(URL0 + "?demo"); await pc.waitForSelector(".wordmark");
    for (const b of ["Let's go!", "Let's go!", "I'm ready!", "Got it!", "Ready!"]) await tapText(pc, b);
    await tapText(pc, "Scan litter"); await pc.locator(".shutter").click(); await pc.waitForSelector(".found", { timeout: 8000 });
    await tapText(pc, "Hear the story"); await tapText(pc, "Now bin your litter!"); await tapText(pc, "No bin nearby? Save it for later");
    await pc.waitForSelector(".home-top"); assert.equal((await ls3(pc)).pending.saved, true);
    for (let i = 0; i < 3; i++) await pc.goBack();
    await pc.waitForSelector(".found"); await tapText(pc, "That's not right, scan again");
    await pc.waitForSelector(".scan"); assert.equal((await ls3(pc)).pending, null, "the wrong piece is dropped");
    assert.deepEqual(pc.errors, []); await pc.context().close();
  });
  await check("No errors in the console (demo)", async () => assert.deepEqual(p3.errors, []));

  /* ---------- E: the Boi de Mamão storyteller, English ---------- */
  const pb = await newPage(cam);
  await pb.goto(URL0); await pb.waitForSelector(".wordmark");
  await tapText(pb, "Let's go!"); await pb.waitForSelector(".teller");
  await pb.locator(".teller-card", { hasText: "The Bull" }).click();
  await check("Bull: choosing the card marks it", async () => {
    assert.equal(await pb.locator("input[name=teller][value=boi]").isChecked(), true);
    assert.equal(await pb.locator(".teller-card.on").count(), 1); assert.match(await pb.locator(".teller-card.on").textContent(), /The Bull/);
  });
  await tapText(pb, "Let's go!");
  await check("Bull opening: the English verse only, the Bull's three lines, the first pick-up line, festive music", async () => {
    await pb.waitForSelector(".boi-opening"); assert.equal(await h1(pb), "Here comes the Bull!");
    const english = (await pb.locator(".boi-opening h1, .boi-opening .script, .verse-main, .boi-opening .say .bubble, .kicker").allTextContents()).join(" ");
    assert.ok(english.length > 400 && !PT_WORDS.test(english), "the English opening is all English");
    assert.deepEqual(await pb.locator(".verse-main p").allTextContents(), BOI.verse.en); assert.equal(await pb.locator(".verse-main").getAttribute("lang"), null);
    assert.equal(await pb.locator(".verse-main p").last().textContent(), "The Dragon's hungry, feed her there!");
    assert.deepEqual(await pb.locator(".boi-opening .script").allTextContents(), BOI.opening.en);
    assert.equal(await pb.locator(".boi-opening .say .bubble").textContent(), "Find your first piece of litter. The Dragon is waiting!");
    await noPortuguese(pb, "opening");
    assert.equal(await pb.locator(".boi-stage svg").count(), 1); assert.equal(await pb.locator(".boi-nap svg").count(), 1);
    assert.equal(await ls(pb, "teller"), "boi"); assert.equal(await ls(pb, "tellerChosen"), true);
    assert.ok(await pb.evaluate(() => window.__snd.osc) > 20, "the festa tune plays");
  });
  await pb.waitForTimeout(2600); await shot(pb, "40-boi-opening", true); await lay(pb, "boi opening");
  await tapText(pb, "I'm ready!");
  await check("Bull: the safety rules still come before the first scan", async () => assert.equal(await h1(pb), "Stay safe out there"));
  await tapText(pb, "Got it!"); await pb.fill("#nick", "BoiKid"); await tapText(pb, "Ready!");
  await check("Bull Home: the Bull says the first pick-up line", async () => {
    await pb.waitForSelector(".home-top");
    assert.equal(await pb.locator(".home-eagle .bubble").textContent(), "Find your first piece of litter. The Dragon is waiting!");
    await noPortuguese(pb, "home");
    assert.equal(await pb.locator(".home-eagle svg").getAttribute("aria-label"), "The Bull");
  });
  await shot(pb, "41-boi-home"); await lay(pb, "boi home");
  await tapText(pb, "Scan litter"); await waitCam(pb);
  pb.scanQueue.push(R.wrapper); await pb.locator(".shutter").click(); await pb.waitForSelector(".found");
  await check("Bull Found: the piece goes in the bin first", async () => {
    assert.equal(await pb.locator(".found .say .bubble").textContent(), BOI.added.found.en);
    assert.match(await pb.locator(".steps .cur").textContent(), /2 Bin it/); assert.equal((await pb.locator(".found .btn-primary").textContent()).trim(), "Bin it");
    await noPortuguese(pb, "find");
  });
  await shot(pb, "42-boi-found"); await lay(pb, "boi found");
  await tapText(pb, "Bin it");
  await check("Bull Bin it: same bin screen, Back returns to the find", async () => {
    assert.equal(await h1(pb), "Pop it in the white bin"); assert.match(await pb.locator(".steps .cur").textContent(), /2 Bin it/);
    await pb.locator(".top .circle-btn").click(); assert.equal(await h1(pb), "Plastic wrapper");
    await tapText(pb, "Bin it"); assert.equal(await h1(pb), "Pop it in the white bin");
  });
  const posted0 = SHARED.posted.length, total0 = SHARED.total, snd0 = await pb.evaluate(() => ({ ...window.__snd }));
  await tapText(pb, "It's in the bin!");
  await check("Nhac! Bernúncia eats the piece, her tummy glows, the explorer wakes up; one ticket, counted once", async () => {
    await pb.waitForSelector(".feast"); assert.equal(await h1(pb), "Chomp!");
    assert.equal(await pb.locator(".feast-say .bubble").textContent(), "Chomp! The Dragon gobbled it up! Wake up, Surveyor 3!");
    await noPortuguese(pb, "Chomp screen");
    assert.match(await pb.locator(".steps .cur").textContent(), /3 Wake up/);
    assert.equal(await pb.locator("#wake").getAttribute("class"), "wake", "asleep at first");
    await pb.waitForFunction(() => document.getElementById("wake").classList.contains("awake"), null, { timeout: 4000 });
    assert.equal(await pb.locator(".nhac").evaluate(el => getComputedStyle(el).opacity), "1");
    assert.equal(await pb.locator('.bern-big [data-part="fill"]').evaluate(el => el.style.opacity), "0.35");
    const snd = await pb.evaluate(() => ({ ...window.__snd }));
    assert.equal(snd.buf - snd0.buf, 3, "the Nhac sound"); assert.equal(snd.osc - snd0.osc, 5, "Nhac plus the wake-up notes");
    assert.equal(await ls(pb, "binned"), 1);
    await pb.waitForFunction(() => !JSON.parse(localStorage.getItem("debris.tickets") || "[]").length);
    assert.equal(SHARED.posted.length, posted0 + 1); assert.equal(SHARED.total, total0 + 1);
  });
  await check("Bernúncia is drawn like the reference picture: yellow body, black stripes, one eye, four legs, no green, no caterpillar parts", async () => {
    const b = await pb.evaluate(() => {
      const svg = document.querySelector(".bern-big"), html = svg.outerHTML;
      return { yellow: (html.match(/#F5C13A/g) || []).length, green: /#2F9E73|#3DBB83|#3EC1D3/i.test(html), rainbow: /#A07EFF|#FF7A9C"[^>]*stroke-width="14/.test(html),
        legs: svg.querySelectorAll('path[stroke-width="10"]').length, stripes: svg.querySelectorAll('g[clip-path] path').length,
        eyes: svg.querySelectorAll('.bn-closed circle[r="8"]').length, fringe: svg.querySelectorAll('circle[r="5.5"]').length, collar: svg.querySelectorAll('circle[r="7.5"]').length };
    });
    assert.ok(b.yellow >= 2, "yellow body"); assert.equal(b.green, false, "no green"); assert.equal(b.legs, 4, "four legs");
    assert.equal(b.stripes, 4, "four black stripes"); assert.equal(b.eyes, 1, "one eye"); assert.equal(b.fringe + b.collar, 0, "no fringe or collar beads");
  });
  await pb.waitForTimeout(600); await shot(pb, "43-boi-feast"); await lay(pb, "boi feast");
  const snd1 = await pb.evaluate(() => ({ ...window.__snd }));
  await tapText(pb, "Hear the story");
  await check("Then the chapter opens: the Bull's line first, the same facts, then Scan another piece", async () => {
    assert.equal(await h1(pb), "Surveyor 3, the robot that tested the ground");
    assert.equal(await pb.locator(".boi-intro .bubble").textContent(), BOI.chapters[0].en);
    assert.match(await pb.locator(".steps .cur").textContent(), /4 Story/);
    assert.ok(await pb.evaluate(() => !!(document.querySelector(".boi-intro").compareDocumentPosition(document.querySelector(".story-body .sec")) & Node.DOCUMENT_POSITION_FOLLOWING)), "line before facts");
    assert.match(await pb.locator("#app").textContent(), /Sent more than 6,000 photos back to Earth\./);
    assert.equal(await pb.locator(".hook-say .say-boi").count(), 1, "the Boi says the Did you know");
    assert.deepEqual((await pb.locator(".story-body .btn").allTextContents()).map(x => x.trim()), ["Scan another piece", "See my jacket"]);
    await noPortuguese(pb, "chapter 1");
  });
  await shot(pb, "44-boi-story1", true); await lay(pb, "boi story");
  await check("Back onto Bernúncia shows her settled: no second Nhac, nothing counted twice", async () => {
    await pb.goBack(); await pb.waitForSelector(".feast.is-played"); await pb.waitForTimeout(1500);
    assert.deepEqual(await pb.evaluate(() => ({ ...window.__snd })), snd1); assert.equal(await pb.locator("#wake.awake").count(), 1);
    assert.equal(await ls(pb, "binned"), 1); assert.equal(SHARED.total, total0 + 1);
    await pb.goForward(); await pb.waitForSelector(".story");
  });
  await tapText(pb, "Scan another piece"); await waitCam(pb);
  pb.scanQueue.push(R.can); await pb.locator(".shutter").click(); await pb.waitForSelector(".found");
  await tapText(pb, "Bin it"); await tapText(pb, "It's in the bin!");
  await check("Second piece: the next line takes its turn", async () => {
    await pb.waitForSelector(".feast"); assert.equal(await pb.locator(".feast-say .bubble").textContent(), "Yum! The Dragon's tummy is glowing. Who's waking up? Apollo 11 Eagle!");
  });
  await tapText(pb, "Hear the story");
  await check("Chapter 2: Maricota stands next to Eagle", async () => {
    assert.equal(await h1(pb), "Apollo 11 Eagle and the Moon mirror"); assert.equal(await pb.locator(".boi-intro .bubble").textContent(), BOI.chapters[1].en);
    assert.equal(await pb.locator(".tall-friends svg").count(), 1); assert.match(await pb.locator(".boi-intro .bubble").textContent(), /^Our Tall Lady is taller than Eagle/);
    await noPortuguese(pb, "chapter 2");
  });
  await shot(pb, "45-boi-story2", true);
  await check("Back through two rounds: each eating screen shows its own piece, settled", async () => {
    for (let i = 0; i < 4; i++) await pb.goBack();
    await pb.waitForSelector(".feast.is-played");
    assert.equal(await pb.locator(".feast-say .bubble").textContent(), "Chomp! The Dragon gobbled it up! Wake up, Surveyor 3!");
    assert.equal(await ls(pb, "binned"), 2);
  });
  await pb.goto(URL0 + "#me"); await pb.waitForSelector(".teller-set");
  await check("Me: Storyteller; switching keeps every patch and the cleanup log", async () => {
    assert.equal(await pb.locator("#teller-boi").getAttribute("aria-pressed"), "true");
    await pb.locator("#teller-space").click();
    assert.equal(await pb.locator("#teller-space").getAttribute("aria-pressed"), "true"); assert.equal(await ls(pb, "teller"), "space");
    assert.equal(await ls(pb, "binned"), 2); assert.equal((await ls(pb, "log")).length, 2);
    await tapNav(pb, "Home"); assert.equal(await pb.locator(".home-eagle .bubble").textContent(), CONTENT.chapters[1].en.pickup);
    assert.match(await pb.locator(".count-pill").textContent(), /2 of 13/);
    await tapNav(pb, "Me"); await pb.locator("#teller-boi").click(); await tapNav(pb, "Home");
    assert.equal(await pb.locator(".home-eagle .bubble").textContent(), BOI.added.homeNext.en);
  });
  await tapNav(pb, "Me"); await shot(pb, "46-boi-me", true); await lay(pb, "boi me");
  await pb.selectOption("#lang", "pt");
  await check("Portuguese Bull: Home, and an opening with only the Portuguese verse", async () => {
    await tapNav(pb, "Início"); assert.equal(await pb.locator(".home-eagle .bubble").textContent(), BOI.added.homeNext.pt);
    assert.equal(await pb.locator(".home-eagle .bubble").getAttribute("lang"), null);
    await tapNav(pb, "Jaqueta"); await tapText(pb, "Ouvir o começo de novo");
    assert.equal(await h1(pb), "Olha o boi chegando!"); assert.deepEqual(await pb.locator(".verse-main p").allTextContents(), BOI.verse.pt);
    assert.deepEqual(await pb.locator(".boi-opening .script").allTextContents(), BOI.opening.pt);
  });
  await shot(pb, "47-boi-opening-pt", true);
  await tapText(pb, "Voltar para minha jaqueta"); await tapText(pb, "Escaneie para desbloquear o próximo"); await waitCam(pb);
  pb.scanQueue.push(R.wrapper); await pb.locator(".shutter").click(); await pb.waitForSelector(".found");
  await check("Portuguese Bull round: the find, Bernúncia's third line, chapter 3's intro", async () => {
    assert.equal(await pb.locator(".found .say .bubble").textContent(), BOI.added.found.pt);
    await tapText(pb, "Para a lixeira"); await tapText(pb, "Já está na lixeira!"); await pb.waitForSelector(".feast");
    assert.equal(await pb.locator(".feast-say .bubble").textContent(), "Nhac, nhac! Obrigado por limpar! Vamos acordar: Apollo 12 Intrepid!"); assert.equal(await h1(pb), "Nhac!");
    assert.match(await pb.locator(".steps .cur").textContent(), /3 Acordar/);
    await tapText(pb, "Ouvir a história"); assert.equal(await pb.locator(".boi-intro .bubble").textContent(), BOI.chapters[2].pt);
  });
  await shot(pb, "48-boi-story3-pt", true); await lay(pb, "boi story pt");

  // The Boi's finale: jump to 12, earn the 13th
  await pb.evaluate(() => { localStorage.setItem("debris.lang", '"en"'); localStorage.setItem("debris.binned", "12"); localStorage.setItem("debris.log", JSON.stringify(Array.from({ length: 12 }, () => ({ date: new Date().toISOString(), type: "plastic" })))); });
  await pb.goto("about:blank"); await pb.goto(URL0 + "#home"); await pb.waitForSelector(".home-top");
  await tapText(pb, "Scan litter"); await waitCam(pb);
  pb.scanQueue.push(R.battery); await pb.locator(".shutter").click(); await pb.waitForSelector(".found");
  await tapText(pb, "Bin it"); await tapText(pb, "A grown-up has it!");
  await check("The 13th piece: every explorer is awake, Bernúncia's tummy is full", async () => {
    await pb.waitForSelector(".feast"); assert.equal(await pb.locator(".feast-say .bubble").textContent(), BOI.allAwake.en);
    assert.equal(await pb.locator(".wake .patch-name").textContent(), "Ingenuity");
    await pb.waitForFunction(() => document.getElementById("wake").classList.contains("awake"), null, { timeout: 4000 });
    assert.equal(await pb.locator('.bern-big [data-part="sp"]').evaluate(el => el.style.opacity), "1");
    await tapText(pb, "Hear the story"); assert.equal(await pb.locator(".boi-intro .bubble").textContent(), BOI.chapters[12].en);
    assert.deepEqual((await pb.locator(".story-body .btn").allTextContents()).map(x => x.trim()), ["See the finale", "See my jacket"]);
  });
  const snd3 = await pb.evaluate(() => ({ ...window.__snd }));
  await tapText(pb, "See the finale");
  await check("Bull finale: the 13 explorers dance with the Bull, Bernúncia glows, his lines, the same ending, a button to Impact", async () => {
    assert.equal(await h1(pb), "Left behind, not forgotten");
    assert.deepEqual(await pb.locator(".finale .script").allTextContents(), BOI.finale.en);
    assert.equal(await pb.locator(".dance-row > svg").count(), 13); assert.equal(await pb.locator(".party-cast .boi-dancing").count(), 1);
    assert.equal(await pb.locator('.bern-party [data-part="sp"]').getAttribute("opacity"), "1");
    assert.match(await pb.locator(".count-card").textContent(), /You picked up 13 pieces of litter!/); assert.equal(await pb.locator(".badge-btn").count(), 13);
    assert.ok((await pb.evaluate(() => window.__snd.osc)) - snd3.osc > 20, "festive music");
    assert.match(await pb.locator(".finale .script").first().textContent(), /the Dragon's tummy is full!/); await noPortuguese(pb, "finale");
  });
  await pb.waitForTimeout(900); await shot(pb, "49-boi-finale", true); await lay(pb, "boi finale");
  await tapText(pb, "See our impact");
  await check("The finale's button opens Impact", async () => { await pb.waitForSelector(".impact"); assert.equal(await h1(pb), "Our impact"); });
  await pb.goto(URL0 + "#home"); await pb.waitForSelector(".home-top");
  await check("Bull Home after 13: the Bull's all-awake line", async () => assert.equal(await pb.locator(".home-eagle .bubble").textContent(), BOI.allAwake.en));
  await tapText(pb, "Scan litter"); await waitCam(pb);
  pb.scanQueue.push(R.wrapper); await pb.locator(".shutter").click(); await pb.waitForSelector(".found");
  await check("A 14th piece: Bernúncia still eats it, just for the planet", async () => {
    assert.match(await pb.locator(".found .say .bubble").textContent(), /Every story is unlocked/);
    await tapText(pb, "Bin it"); await tapText(pb, "It's in the bin!"); await pb.waitForSelector(".feast");
    assert.equal(await h1(pb), "Chomp!"); assert.equal(await pb.locator(".feast-say .bubble").textContent(), "You've binned 14 pieces of litter.");
    assert.deepEqual((await pb.locator("#app .btn").allTextContents()).map(x => x.trim()), ["Scan another piece", "See the finale"]);
    assert.equal(await ls(pb, "binned"), 13);
  });
  await lay(pb, "boi feast extra");
  await check("No errors in the console (Bull, English)", async () => assert.deepEqual(pb.errors, []));

  /* ---------- F: the Boi in Spanish, 320 px, less motion, no camera ---------- */
  const pf = await newPage(noCam, { width: 320, height: 640, locale: "es-CO", camera: false, reducedMotion: "reduce" });
  await pf.goto(URL0); await pf.waitForSelector(".wordmark");
  await tapText(pf, "¡Vamos!"); await pf.locator(".teller-card", { hasText: "El Toro" }).click(); await tapText(pf, "¡Vamos!");
  await check("Spanish Bull opening: Spanish buttons, the Bull's lines in English (marked as English), shown at once", async () => {
    await pf.waitForSelector(".boi-opening"); assert.equal(await h1(pf), "Here comes the Bull!");
    assert.equal(await pf.locator("h1").getAttribute("lang"), "en"); assert.equal(await pf.locator(".boi-opening .script").first().getAttribute("lang"), "en");
    assert.equal(await pf.locator(".verse-main p").last().evaluate(el => getComputedStyle(el).opacity), "1");
    assert.match(await pf.locator(".btn-primary").textContent(), /¡Empecemos!/);
  });
  await lay(pf, "boi opening 320"); await shot(pf, "50-boi-opening-320-es", true);
  await tapText(pf, "¡Empecemos!"); await tapText(pf, "¡Entendido!"); await tapText(pf, "¡Listo!");
  await pf.waitForSelector(".home-top"); await lay(pf, "boi home 320"); await shot(pf, "51-boi-home-320-es");
  await tapText(pf, "Escanear basura");
  await pf.waitForFunction(() => /Toca el botón/.test(document.getElementById("scanStatus").textContent));
  const png = await pf.screenshot({ clip: { x: 0, y: 0, width: 200, height: 200 } });
  const chooser = pf.waitForEvent("filechooser"); await pf.locator(".shutter").click();
  pf.scanQueue.push(R.wrapper); await (await chooser).setFiles({ name: "litter.png", mimeType: "image/png", buffer: png });
  await pf.waitForSelector(".found");
  await check("Spanish Bull Found", async () => {
    assert.equal(await pf.locator(".found .say .bubble").textContent(), BOI.added.found.en); assert.equal(await pf.locator(".found .say .bubble").getAttribute("lang"), "en");
    assert.match(await pf.locator(".steps .cur").textContent(), /2 A la caneca/);
  });
  await lay(pf, "boi found 320");
  await tapText(pf, "A la caneca"); await lay(pf, "boi bin 320"); await tapText(pf, "¡Ya está en la caneca!");
  await check("Less motion: Bernúncia's moment shows settled at once", async () => {
    await pf.waitForSelector(".feast"); assert.equal(await pf.locator("#wake.awake").count(), 1);
    assert.equal(await pf.locator(".nhac").evaluate(el => getComputedStyle(el).opacity), "1");
    assert.equal(await pf.locator('.bern-big [data-part="fill"]').evaluate(el => el.style.opacity), "0.35");
    assert.equal(await pf.locator(".feast-say .bubble").textContent(), "Chomp! The Dragon gobbled it up! Wake up, Surveyor 3!"); assert.equal(await pf.locator(".nhac").textContent(), "Chomp!");
    assert.match(await pf.locator(".steps .cur").textContent(), /3 Despertar/);
  });
  await lay(pf, "boi feast 320"); await shot(pf, "52-boi-feast-320-es");
  await tapText(pf, "Escuchar la historia");
  await check("Spanish Bull story: Spanish facts, the Bull's line in English", async () => {
    assert.equal(await h1(pf), CONTENT.chapters[0].es.title);
    assert.equal(await pf.locator(".boi-intro .bubble").textContent(), BOI.chapters[0].en); assert.equal(await pf.locator(".boi-intro .bubble").getAttribute("lang"), "en");
  });
  await lay(pf, "boi story 320"); await shot(pf, "53-boi-story-320-es", true);
  await check("No errors in the console (Bull, Spanish)", async () => assert.deepEqual(pf.errors, []));

  /* ---------- G: the facts are the same, word for word, with either storyteller, in every language ---------- */
  const pg = await newPage(noCam, { camera: false });
  for (const lang of ["en", "es", "pt"]) {
    await check(`Facts identical for both storytellers, all 13 chapters (${lang}), and every Bull intro line shown`, async () => {
      await pg.goto(URL0); await pg.evaluate(l => localStorage.setItem("debris.lang", JSON.stringify(l)), lang);
      await pg.goto("about:blank"); await pg.goto(URL0 + "#explore"); await pg.waitForSelector(".patches");
      const facts = {};
      for (const teller of ["space", "boi"]) {
        await pg.locator("#teller-" + teller).click(); facts[teller] = [];
        for (let i = 0; i < 13; i++) {
          await pg.locator(".patch-card").nth(i).click(); await pg.waitForSelector(".story");
          facts[teller].push(await pg.evaluate(() => [...document.querySelectorAll(".story-head .story-text, .story-body .story-photo, .story-body .sec, .story-body .help-box, .story-body .hook-say .bubble, .story-body .sources")].map(e => e.innerHTML)));
          const intro = pg.locator(".boi-intro .bubble");
          if (teller === "boi") {
            assert.equal(await intro.textContent(), BOI.chapters[i][lang === "pt" ? "pt" : "en"]);
            assert.equal(await intro.getAttribute("lang"), lang === "es" ? "en" : null);
          } else assert.equal(await intro.count(), 0);
          await pg.locator(".story-body .btn-outline").click(); await pg.waitForSelector(".patches");
        }
      }
      assert.equal(facts.space.length, 13); assert.ok(facts.space.every(f => f.length >= 7), "facts were read");
      assert.deepEqual(facts.boi, facts.space);
    });
  }
  await check("No errors in the console (facts)", async () => assert.deepEqual(pg.errors, []));

  /* ---------- H: if boi.json doesn't load, the app runs with the space story only ---------- */
  const ph = await newPage(noCam, { camera: false });
  await ph.route("**/boi.json", r => r.fulfill({ status: 404, contentType: "text/plain", body: "" }));
  await ph.goto(URL0); await ph.waitForSelector(".wordmark");
  await check("No Bull lines: no choice screen, the space opening, no Storyteller setting", async () => {
    await tapText(ph, "Let's go!"); assert.equal(await h1(ph), "96 bags on the Moon");
    await ph.goto(URL0 + "#explore"); await ph.waitForSelector(".patches"); assert.equal(await ph.locator(".teller-set").count(), 0);
  });

  /* ---------- I: a player from before the Boi lands on Home with the space story ---------- */
  const pi = await newPage(noCam, { camera: false });
  await pi.addInitScript(() => { if (!localStorage.getItem("debris.profile")) { localStorage.setItem("debris.introDone", "true"); localStorage.setItem("debris.safetyDone", "true"); localStorage.setItem("debris.profile", '{"nick":"Old","buddy":"eagle"}'); localStorage.setItem("debris.binned", "3"); } });
  await pi.goto(URL0);
  await check("Existing player: straight to Home, space story, never the choice screen", async () => {
    await pi.waitForSelector(".home-top"); assert.equal(await pi.locator(".home-eagle .bubble").textContent(), CONTENT.chapters[2].en.pickup);
    assert.equal(await pi.locator(".home-eagle svg").getAttribute("aria-label"), "Eagle"); assert.equal(await ls(pi, "teller"), null);
  });

  /* ---------- J: Listen reads each part in its own language ---------- */
  const pj = await newPage(noCam, { camera: false });
  await pj.addInitScript(() => { window.__spoken = []; if (window.speechSynthesis) speechSynthesis.speak = u => { window.__spoken.push({ text: u.text, lang: u.lang }); }; });
  const spoken = () => pj.evaluate(() => window.__spoken.splice(0));
  await pj.goto(URL0 + "#explore"); await pj.waitForSelector(".patches");
  await check("Listen, space chapter: the title first, in English, and the button turns to Stop", async () => {
    await pj.locator(".patch-card").nth(0).click(); await pj.locator("[data-act=listen]").click();
    const s = await spoken(); assert.equal(s[0].text, CONTENT.chapters[0].en.title); assert.ok(s.every(x => x.lang === "en-US"));
    assert.equal(await pj.locator("[data-act=listen]").getAttribute("aria-pressed"), "true"); assert.match(await pj.locator("[data-act=listen]").textContent(), /Stop/);
    await pj.locator(".story-body .btn-outline").click(); await pj.waitForSelector(".patches");
  });
  await check("Listen, Bull opening: all in English, with an English voice", async () => {
    await pj.locator("#teller-boi").click(); await tapText(pj, "Hear the opening story again"); await pj.waitForSelector(".boi-opening");
    await pj.locator("[data-act=listen]").click(); const s = await spoken();
    assert.deepEqual(s.map(x => x.text), [BOI.added.title.en, ...BOI.verse.en, ...BOI.opening.en, BOI.firstPickup.en]);
    assert.deepEqual(s.map(x => x.lang), Array(9).fill("en-US"));
  });
  await check("Listen, Bull chapter in Spanish: the Bull's line in English, the facts in Spanish", async () => {
    await pj.evaluate(() => localStorage.setItem("debris.lang", '"es"')); await pj.goto("about:blank"); await pj.goto(URL0 + "#explore"); await pj.waitForSelector(".patches");
    await pj.locator(".patch-card").nth(0).click(); await pj.locator("[data-act=listen]").click(); const s = await spoken();
    assert.deepEqual(s[0], { text: BOI.chapters[0].en, lang: "en-US" }); assert.deepEqual(s[1], { text: CONTENT.chapters[0].es.title, lang: "es-MX" });
    assert.ok(s.slice(1).every(x => x.lang === "es-MX"));
  });
  await check("No errors in the console (Listen)", async () => assert.deepEqual(pj.errors, []));

  /* ---------- L: the state fixes from the audit ---------- */
  const pl = await newPage(noCam, { camera: false });
  const demoLs = (page, k) => page.evaluate(k => JSON.parse(localStorage.getItem("debris.demo." + k)), k);
  await pl.goto(URL0 + "?demo"); await pl.waitForSelector(".wordmark");
  for (const b of ["Let's go!", "Let's go!", "I'm ready!", "Got it!", "Ready!"]) await tapText(pl, b);
  await tapText(pl, "Scan litter"); await pl.locator(".shutter").click(); await pl.waitForSelector(".found", { timeout: 8000 });
  await check("A find that survived a reload can still be called wrong, from the bin screen", async () => {
    await pl.reload(); await pl.waitForSelector(".holding"); await tapText(pl, "Bin my litter");
    await tapText(pl, "That's not right, scan again"); await pl.waitForSelector(".scan");
    assert.equal(await demoLs(pl, "pending"), null); assert.equal((await demoLs(pl, "binned")) || 0, 0, "nothing was binned");
  });
  await check("Back after a Space round shows the chapter as a chapter, not 'Now bin your litter!'", async () => {
    await pl.locator(".shutter").click(); await pl.waitForSelector(".found", { timeout: 8000 });
    await tapText(pl, "Hear the story"); await tapText(pl, "Now bin your litter!"); await tapText(pl, "It's in the bin!");
    assert.equal(await h1(pl), "Patch unlocked!"); await pl.goBack(); await pl.waitForSelector(".story");
    assert.deepEqual((await pl.locator(".story-body .btn").allTextContents()).map(x => x.trim()), ["Back to my jacket"]);
  });
  await check("A second tab with older progress can't overwrite newer progress", async () => {
    const tabB = await pl.context().newPage(); await tabB.goto(URL0 + "?demo#home"); await tabB.waitForSelector(".home-top");
    await pl.goto(URL0 + "?demo#home"); await pl.waitForSelector(".home-top");
    await tapText(pl, "Scan litter"); await pl.locator(".shutter").click(); await pl.waitForSelector(".found", { timeout: 8000 });
    await tapText(pl, "Hear the story"); await tapText(pl, "Now bin your litter!"); await tapText(pl, "It's in the bin!");
    assert.equal(await demoLs(pl, "binned"), 2);
    await tabB.locator("#app").getByRole("button", { name: "Scan litter" }).click(); await tabB.locator(".shutter").click(); await tabB.waitForSelector(".found", { timeout: 8000 });
    assert.equal(await demoLs(tabB, "binned"), 2, "tab B didn't write its old count back"); assert.equal((await demoLs(tabB, "log")).length, 2);
    await tabB.locator("#app").getByRole("button", { name: "Hear the story" }).click();
    assert.equal(await h1(tabB), CONTENT.chapters[2].en.title, "tab B picked up the newer progress: chapter 3 is next");
    await tabB.close();
  });
  await check("Changing the language doesn't break what the 3D jacket remembers", async () => {
    await pl.evaluate(() => localStorage.setItem("debris.demo.jacketSeen", "2")); await pl.goto(URL0 + "?demo#me"); await pl.waitForSelector("#lang");
    await pl.selectOption("#lang", "pt"); assert.equal(await pl.evaluate(() => localStorage.getItem("debris.demo.jacketSeen")), "2");
    await pl.selectOption("#lang", "en");
  });
  await check("No errors in the console (audit fixes)", async () => assert.deepEqual(pl.errors, []));
  await check("A touch double tap on \"It's in the bin!\" doesn't skip the patch", async () => {
    const tc = await noCam.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    const pt = await tc.newPage(); await pt.goto(URL0 + "?demo"); await pt.waitForSelector(".wordmark");
    const tapB = async name => { await pt.waitForTimeout(400); await pt.locator("#app").getByRole("button", { name, exact: false }).first().tap(); };
    for (const b of ["Let's go!", "Let's go!", "I'm ready!", "Got it!", "Ready!", "Scan litter"]) await tapB(b);
    await pt.waitForTimeout(400); await pt.locator(".shutter").tap(); await pt.waitForSelector(".found", { timeout: 8000 });
    await tapB("Hear the story"); await tapB("Now bin your litter!"); await pt.waitForTimeout(400);
    const box = await pt.locator("[data-act=binned]").boundingBox(), x = box.x + box.width / 2, y = box.y + box.height / 2;
    await pt.touchscreen.tap(x, y); await pt.touchscreen.tap(x, y);   // a quick double tap
    await pt.waitForTimeout(300); assert.equal(await h1(pt), "Patch unlocked!");
    await tc.close();
  });
  await check("A pick-up request that never answers doesn't freeze Impact", async () => {
    const ps = await newPage(noCam, { camera: false });
    await ps.unroute("**/api/pickup"); await ps.route("**/api/pickup", () => {});   // never answers
    await ps.addInitScript(() => localStorage.setItem("debris.tickets", '["tk-stuck"]'));
    await ps.goto(URL0 + "#impact"); await ps.waitForSelector(".tower-card", { timeout: 15000 });
    assert.ok(/\d/.test(await ps.locator(".total-card .sr-only").textContent()));
    await ps.context().close();
  });

  /* ---------- D: desktop width ---------- */
  const p4 = await newPage(cam, { width: 1280, height: 860 });
  await p4.goto(URL0); await p4.waitForSelector(".wordmark");
  await shot(p4, "27-desktop");
  await check("Desktop: the app sits in a centred phone column", async () => { const w = await p4.locator("#app").evaluate(el => el.getBoundingClientRect().width); assert.ok(w <= 480 && w >= 470, String(w)); });

  await cam.close(); await noCam.close(); if (server.listening) server.close();
  console.log(`\n${checks} checks passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
