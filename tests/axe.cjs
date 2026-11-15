/* Accessibility audit (axe-core, WCAG 2.1 A/AA + best practices) on every screen, both storytellers, demo mode.
   node tests/axe.cjs [path to axe.min.js]   (default: the axe-core package, e.g. after npm install --no-save axe-core) */
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const repo = path.join(__dirname, ".."), axePath = process.argv[2] || require.resolve("axe-core/axe.min.js");
const AXE = fs.readFileSync(axePath, "utf8");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".jpg": "image/jpeg", ".glb": "model/gltf-binary", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(repo, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise(ok => server.listen(0, ok)); const URL0 = `http://127.0.0.1:${server.address().port}/`;
  const b = await chromium.launch(), all = {};
  async function audit(page, name) {
    await page.waitForTimeout(2200);   // let entrance animations finish, so colours are final
    await page.evaluate(AXE);
    const r = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] }, rules: { "region": { enabled: false } } }));
    for (const v of r.violations) { const k = v.id + " (" + v.impact + "): " + v.help; (all[k] = all[k] || []).push(name + " ×" + v.nodes.length + " e.g. " + v.nodes[0].target.join(" ") + " | " + (v.nodes[0].failureSummary || "").split("\n").slice(1, 2).join("").trim().slice(0, 90)); }
    console.log((r.violations.length ? "  " : "ok") + " " + name + ": " + r.violations.length + " issue types");
  }
  for (const teller of ["space", "boi"]) {
    const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, locale: "en-US" })).newPage();
    const tap = sel => page.locator(sel).first().click();
    await page.goto(URL0 + "?demo"); await page.waitForSelector(".wordmark"); await audit(page, "welcome");
    await tap(".welcome .btn-primary"); await page.waitForSelector(".teller"); if (teller === "space") await audit(page, "storyteller");
    if (teller === "boi") await page.locator(".teller-card").nth(1).click();
    await tap(".teller .btn-primary"); await page.waitForSelector(".opening"); await audit(page, teller + " opening");
    await tap("[data-act=openingDone]"); await audit(page, teller === "space" ? "safety" : "safety (bull)");
    await tap("[data-act=safetyDone]"); if (teller === "space") await audit(page, "profile");
    await tap("form[data-form=profile] button[type=submit]"); await page.waitForSelector(".home-top"); await audit(page, teller + " home");
    await tap(".btn-big"); await page.waitForSelector(".scan"); await audit(page, "scan");
    await tap(".shutter"); await page.waitForSelector(".found", { timeout: 10000 }); await audit(page, teller + " found");
    if (teller === "space") { await tap(".found .btn-primary"); await page.waitForSelector(".story"); await audit(page, "space story (round)"); await tap(".story-body .btn-primary"); }
    else await tap(".found .btn-primary");
    await page.waitForSelector(".bin"); await audit(page, teller + " bin");
    await tap("[data-act=binned]"); await page.waitForSelector(teller === "space" ? ".unlocked" : ".feast"); await audit(page, teller === "space" ? "unlocked" : "bull eating screen");
    if (teller === "boi") { await tap(".feast .btn-primary"); await page.waitForSelector(".story"); await audit(page, "bull story"); }
    // a dangerous find and a retake come next in demo mode's list
    await page.goto(URL0 + "?demo#home"); await page.waitForSelector(".home-top");
    await tap(".btn-big"); await tap(".shutter"); await page.waitForSelector(".found", { timeout: 10000 }); await tap("[data-act=rescan]");
    await page.waitForSelector(".scan"); await tap(".shutter"); await page.waitForSelector(".danger", { timeout: 10000 }); if (teller === "space") await audit(page, "danger");
    for (const [hash, sel, label] of [["jacket", ".jacket", "jacket"], ["me", ".me", "me"], ["impact", ".tower-card", "impact"], ["explore", ".patches", "explore"], ["usage", "#usage", "live usage"], ["sources", ".src-list", "sources"], ["photos", ".info", "photos"], ["grownups", ".grownups", "grown-ups"]]) {
      if (teller === "boi" && !["jacket", "me", "explore"].includes(hash)) continue;
      await page.goto("about:blank"); await page.goto(URL0 + "?demo#" + hash); await page.waitForSelector(sel); await audit(page, (teller === "boi" ? "bull " : "") + label);
    }
    await page.evaluate(() => { localStorage.setItem("debris.demo.binned", "13"); localStorage.setItem("debris.demo.finaleSeen", "true"); });
    await page.goto("about:blank"); await page.goto(URL0 + "?demo#finale"); await page.waitForSelector(".finale"); await audit(page, teller + " finale");
    await page.context().close();
  }
  await b.close(); server.close();
  const keys = Object.keys(all);
  console.log("\n" + (keys.length ? keys.length + " kinds of accessibility issue:" : "No accessibility issues found by axe."));
  for (const k of keys) console.log("- " + k + "\n    " + all[k].join("\n    "));
})().catch(e => { console.error(e); process.exit(1); });
