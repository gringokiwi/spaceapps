/* State-machine audit: seeded random walks through the real app (mock server, fake camera), checking the rules in
   docs/screens-and-state.md after every step. Usage: node tests/monkey.cjs [seeds=16] [steps=120] */
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const repo = path.join(__dirname, ".."), [SEEDS = "16", STEPS = "120"] = process.argv.slice(2);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".jpg": "image/jpeg", ".glb": "model/gltf-binary", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(repo, p); if (!f.startsWith(repo) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
});
const R = [
  { result: { photo_problem: "none", is_trash: "yes", type: "plastic", bin: "white", dangerous: false, item: "Plastic wrapper", message: "" }, counts: true, retake: false },
  { result: { photo_problem: "none", is_trash: "yes", type: "can", bin: "white", dangerous: false, item: "Drink can", message: "" }, counts: true, retake: false },
  { result: { photo_problem: "none", is_trash: "yes", type: "batteries_electronics", bin: "special_dropoff", dangerous: false, item: "AA battery", message: "" }, counts: true, retake: false },
  { result: { photo_problem: "none", is_trash: "yes", type: "sharp_object", bin: "special_dropoff", dangerous: true, item: "Broken glass", message: "" }, counts: true, retake: false, noTicket: true },
  { result: { photo_problem: "screen", is_trash: "no", type: "none", bin: "none", dangerous: false, item: "", message: "Screen" }, counts: false, retake: true },
  { result: { photo_problem: "none", is_trash: "no", type: "none", bin: "none", dangerous: false, item: "Leaf", message: "Leaf" }, counts: false, retake: false },
  { result: { photo_problem: "none", is_trash: "unsure", type: "other", bin: "black", dangerous: false, item: "Thing", message: "Hmm" }, counts: false, retake: false }
];
const ALL_SCREENS = ["welcome", "storyteller", "opening", "safety", "profile", "home", "scan", "found", "story", "bin", "unlocked", "feast", "danger", "retry", "jacket", "me", "grownups", "photos", "explore", "usage", "sources", "finale", "impact", "nope"];
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

async function walk(browser, URL0, seed, steps) {
  const rand = rng(seed), pick = a => a[Math.floor(rand() * a.length)];
  const SH = { total: 1000, issued: 0, posted: [], counted: new Set() };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ["camera"], locale: pick(["en-US", "pt-BR", "es-CO"]) });
  const page = await ctx.newPage(), errors = [], trail = [];
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });
  page.on("dialog", d => d.dismiss().catch(() => {}));
  page.on("popup", p => p.close().catch(() => {}));
  page.on("filechooser", fc => fc.setFiles([]).catch(() => {}));
  const queue = [];
  await page.route("**/api/scan", async r => { const next = queue.shift() || pick(R); await new Promise(z => setTimeout(z, 60)); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...next, ticket: next.counts && !next.noTicket ? "tk-" + seed + "-" + (++SH.issued) : null }) }); });
  await page.route("**/api/counter", r => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ total: 5000, pickups: SH.total, live: { day: "2026-11-15", players: 1, photos: 1, pieces: 1, types: {} } }) }));
  await page.route("**/api/pickup", r => { const t = JSON.parse(r.request().postData()).ticket; SH.posted.push(t); const fresh = !SH.counted.has(t); if (fresh) { SH.counted.add(t); SH.total++; } r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ pickups: SH.total, counted: fresh }) }); });
  const state = async () => { await page.waitForSelector("#app h1", { timeout: 6000 }).catch(() => {}); return page.evaluate(() => { const g = k => { try { return JSON.parse(localStorage.getItem("debris." + k)); } catch { return null; } };
    const h = document.querySelector("#app h1");
    return { binned: g("binned") || 0, log: (g("log") || []).length, teller: g("teller"), hash: location.hash, histName: history.state && history.state.name,
      h1: h ? h.textContent.trim() : "", exits: document.querySelectorAll("#app button:not([disabled]), #app a, #app input[type=submit], #app label.teller-card, #app label.buddy").length,
      cls: (document.getElementById("app") || {}).className || "(no app yet)" }; }); };
  const fail = (why, extra = "") => { throw new Error(`seed ${seed}: ${why} ${extra}\n  trail: ${trail.slice(-14).join(" → ")}`); };
  await page.goto(URL0); await page.waitForSelector("#app h1");
  let prev = await state(); const seen = new Set();
  for (let i = 0; i < steps; i++) {
    const r = rand(); let act;
    try {
      if (r < .07) { act = "back"; await page.evaluate(() => history.back()); }
      else if (r < .10) { act = "forward"; await page.evaluate(() => history.forward()); }
      else if (r < .13) { act = "reload"; await page.reload(); }
      else if (r < .16) { const s = pick(ALL_SCREENS); act = "#" + s; await page.goto("about:blank"); await page.goto(URL0 + "#" + s); }
      else if (r < .19 && await page.locator("#lang").count()) { const l = pick(["en", "es", "pt"]); act = "lang:" + l; await page.selectOption("#lang", l); }
      else if (await page.locator(".shutter:not([disabled])").count() && rand() < .7) {
        act = "shoot"; await page.waitForFunction(() => { const v = document.getElementById("cam"); return v && v.videoWidth > 0; }, null, { timeout: 4000 }).catch(() => {});
        queue.push(pick(R)); await page.locator(".shutter").click({ timeout: 2000 });
        await page.waitForFunction(() => !document.querySelector(".scan") || document.getElementById("scanBusy").hidden, null, { timeout: 5000 }).catch(() => {});
      } else {
        const primary = page.locator("#app .btn-primary:visible, #app form button[type=submit]:visible");
        const els = rand() < .5 && await primary.count() ? await primary.all() : await page.locator("#app button:visible, #app label.teller-card:visible, #app label.buddy:visible").all();
        const ok = [];
        for (const el of els) { const a = await el.getAttribute("data-act"); if (a === "choose" || a === "reload") continue; if (await el.isDisabled().catch(() => true)) continue; ok.push(el); }
        if (!ok.length) { act = "noop"; }
        else { const el = pick(ok); act = "tap:" + ((await el.textContent().catch(() => "")) || (await el.getAttribute("aria-label")) || "?").trim().slice(0, 24); await el.click({ timeout: 2000 }).catch(e => { act += "(missed)"; }); }
      }
    } catch (e) { act = (act || "?") + "(error " + e.message.split("\n")[0].slice(0, 60) + ")"; }
    await page.waitForTimeout(140);
    if (!page.url().startsWith(URL0)) { act += " (left the app: reopened it)"; await page.goto(URL0); }   // Back past the first page leaves the app
    trail.push(act);
    await page.waitForSelector("#app h1", { timeout: 5000 }).catch(() => {});
    const s = await state();
    if (errors.length) fail("page error", errors.join(" | "));
    if (!s.h1) fail("screen without a heading", s.cls);
    if (!s.exits && !/scan/.test(s.cls)) fail("dead end: no way out", s.cls);
    if (s.binned < prev.binned) fail("patches went down", `${prev.binned} → ${s.binned}`);
    if (s.log < prev.log) fail("cleanup log shrank", `${prev.log} → ${s.log}`);
    if (s.binned > 13 || s.log < s.binned) fail("binned out of range or above the log", JSON.stringify(s));
    if (s.histName && s.hash !== "#" + s.histName) fail("address and screen disagree", `${s.hash} vs ${s.histName}`);
    if (new Set(SH.posted).size !== SH.posted.length) fail("a ticket was posted twice", SH.posted.join(","));
    if (SH.counted.size > s.log) fail("more pick-ups counted than pieces binned", `${SH.counted.size} > ${s.log}`);
    if (act.startsWith("tap:") && prev.teller !== s.teller && (prev.binned !== s.binned || prev.log !== s.log)) fail("switching storyteller changed progress");
    seen.add(s.cls.replace(/^screen t-\w+ ?/, "") + (s.teller === "boi" ? " (Bull)" : ""));
    prev = s;
  }
  // At rest, every binned piece that had a ticket is counted exactly once
  await page.waitForFunction(() => !JSON.parse(localStorage.getItem("debris.tickets") || "[]").length, null, { timeout: 5000 }).catch(() => {});
  const s = await state();
  await ctx.close();
  walk.seen = (walk.seen || new Set()); seen.forEach(x => walk.seen.add(x));
  return { seed, steps, binned: s.binned, log: s.log, counted: SH.counted.size, posted: SH.posted.length, last: trail.slice(-3).join(" → ") };
}

(async () => {
  await new Promise(ok => server.listen(0, ok));
  const URL0 = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  let failed = 0;
  for (let seed = 1; seed <= +SEEDS; seed++) {
    try { const r = await walk(browser, URL0, seed, +STEPS); console.log("ok - seed", seed, JSON.stringify(r)); }
    catch (e) { failed++; console.log("FAIL -", e.message); }
  }
  await browser.close(); server.close();
  console.log("screens reached:", [...(walk.seen || [])].sort().join(" | "));
  console.log(`\n${+SEEDS - failed} of ${SEEDS} random walks passed`);
  process.exit(failed ? 1 : 0);
})();
