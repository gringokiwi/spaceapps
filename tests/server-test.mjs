import assert from "node:assert/strict";
/* The server code with a fake Claude: node tests/server-test.mjs (needs npm install) */
const repo = process.argv[2] || decodeURIComponent(new URL("..", import.meta.url).pathname).replace(/\/$/, "");
const common = await import(`${repo}/netlify/lib/common.mjs`);
const scanner = await import(`${repo}/netlify/lib/scanner.mjs`);
const { default: handler } = await import(`${repo}/netlify/functions/scan.mjs`);
const { default: counter } = await import(`${repo}/netlify/functions/counter.mjs`);
const { default: pickup } = await import(`${repo}/netlify/functions/pickup.mjs`);
const { zodOutputFormat } = await import(`${repo}/node_modules/@anthropic-ai/sdk/helpers/zod.js`);

const store = common.memoryStore(); common.setStore(store);
let next = null, seen = null, fail = null;
scanner.setClaudeClient({ messages: { parse: async (p) => { seen = p; if (fail) throw fail; return { stop_reason: "end_turn", parsed_output: next }; } } });
const IMG = "data:image/jpeg;base64," + "A".repeat(200);
const call = async (body, ip = "1.1.1.1") => { const r = await handler(new Request("http://x/api/scan", { method: "POST", headers: { "x-nf-client-connection-ip": ip }, body: JSON.stringify(body) }), { ip }); return [r.status, await r.json()]; };
const pick = async ticket => { const r = await pickup(new Request("http://x/api/pickup", { method: "POST", body: JSON.stringify({ ticket }) })); return [r.status, await r.json()]; };
const total = async () => (await (await counter()).json()).pickups;
let ok = 0; const t = async (name, fn) => { await fn(); ok++; console.log("ok -", name); };

const fmt = zodOutputFormat(scanner.ScanSchema), s = JSON.stringify(fmt.schema || (fmt.json_schema && fmt.json_schema.schema) || fmt);
assert.ok(/"required":\[[^\]]*"item"/.test(s)); console.log("ok - schema has a required item field");

process.env.ANTHROPIC_API_KEY = "test-key";
const TRASH = { photo_problem: "none", is_trash: "yes", type: "plastic", bin: "white", dangerous: false, item: "  Envoltura   de plástico ", message: "¡Bien hecho!" };
let ticket;
await t("Spanish trash: item and language reach the model, a ticket comes back, the total doesn't move", async () => {
  next = TRASH;
  const [st, j] = await call({ image: IMG, lang: "es" });
  assert.equal(st, 200); assert.equal(j.result.item, "Envoltura de plástico"); assert.equal(j.counts, true);
  assert.match(j.ticket, /^[0-9a-f]{24}\.\d{13}\.[A-Za-z0-9_-]{43}$/); ticket = j.ticket;
  assert.equal(j.total, 1, "found (Live usage) still counts at scan"); assert.equal(await total(), 0);
  assert.equal(seen.model, "claude-haiku-5-5"); assert.ok(seen.messages[0].content[1].text.includes("Spanish (Latin American)"));
});
await t("Confirming the pick-up adds exactly 1, and another phone sees it", async () => {
  const [st, j] = await pick(ticket); assert.equal(st, 200); assert.deepEqual(j, { pickups: 1, counted: true });
  assert.equal(await total(), 1);
});
await t("The same ticket again doesn't count twice, and still answers 200", async () => {
  const [st, j] = await pick(ticket); assert.equal(st, 200); assert.deepEqual(j, { pickups: 1, counted: false }); assert.equal(await total(), 1);
});
await t("The same ticket sent twice at once counts once", async () => {
  next = TRASH; const [, j] = await call({ image: IMG, lang: "en" });
  const [[a, ja], [b, jb]] = await Promise.all([pick(j.ticket), pick(j.ticket)]);
  assert.equal(a, 200); assert.equal(b, 200); assert.equal([ja.counted, jb.counted].filter(Boolean).length, 1); assert.equal(await total(), 2);
});
await t("If counting fails, the ticket isn't burnt: the phone's retry counts it", async () => {
  next = TRASH; const [, j] = await call({ image: IMG, lang: "en" });
  const real = store.setJSON.bind(store); let failOnce = true;
  store.setJSON = async (k, v) => { if (k === common.PICKUPS && failOnce) { failOnce = false; throw new Error("disk full"); } return real(k, v); };
  const [st1] = await pick(j.ticket); assert.equal(st1, 503);
  store.setJSON = real;
  const [st2, j2] = await pick(j.ticket); assert.equal(st2, 200); assert.equal(j2.counted, true); assert.equal(await total(), 3);
});
await t("Forged, malformed and expired tickets are refused", async () => {
  const forged = ticket.slice(0, -2) + (ticket.endsWith("AA") ? "BB" : "AA");
  assert.equal((await pick(forged))[0], 400); assert.equal((await pick("+1"))[0], 400); assert.equal((await pick(""))[0], 400);
  const old = common.makeTicket(Date.now() - (common.TICKET_DAYS + 1) * 86400000);
  const [st, j] = await pick(old); assert.equal(st, 410); assert.equal(j.code, "expired"); assert.equal(await total(), 3);
});
await t("A ticket made with another key is refused", async () => {
  const key = process.env.ANTHROPIC_API_KEY; process.env.ANTHROPIC_API_KEY = "another-key";
  const other = common.makeTicket(); process.env.ANTHROPIC_API_KEY = key;
  assert.equal((await pick(other))[0], 400);
});
await t("Dangerous finds, retakes and not-litter get no ticket", async () => {
  next = { photo_problem: "none", is_trash: "unsure", type: "sharp_object", bin: "black", dangerous: false, item: "Broken glass", message: "Careful" };
  let [, j] = await call({ image: IMG, lang: "en" }); assert.equal(j.result.dangerous, true); assert.equal(j.ticket, null); assert.equal(j.counts, true, "found, for Live usage");
  next = { photo_problem: "people", is_trash: "no", type: "none", bin: "none", dangerous: false, item: "A boy", message: "x" };
  [, j] = await call({ image: IMG, lang: "pt" }); assert.equal(j.retake, true); assert.equal(j.ticket, null); assert.equal(j.result.item, ""); assert.match(j.result.message, /pessoa/);
  next = { photo_problem: "none", is_trash: "no", type: "none", bin: "none", dangerous: false, item: "Leaf", message: "That's a leaf." };
  [, j] = await call({ image: IMG, lang: "fr" }); assert.equal(j.ticket, null); assert.ok(seen.messages[0].content[1].text.endsWith("in English."));
  assert.equal(await total(), 3);
});
await t("AI failure answers in the player's language", async () => {
  fail = Object.assign(new Error("boom"), { code: "ai_failed" });
  const [st, j] = await call({ image: IMG, lang: "es" }); fail = null;
  assert.equal(st, 502); assert.equal(j.error, "Eagle no pudo mirar la foto. Intenta otra vez.");
});
await t("Bad image is refused", async () => { const [st, j] = await call({ image: "data:text/plain;base64,AAAA", lang: "en" }); assert.equal(st, 400); assert.equal(j.code, "bad_image"); });
await t("Per-player daily limit, localized", async () => {
  process.env.PHOTOS_PER_PLAYER_PER_DAY = "1"; next = TRASH;
  const [a] = await call({ image: IMG, lang: "pt" }, "9.9.9.9"); const [b, j] = await call({ image: IMG, lang: "pt" }, "9.9.9.9");
  assert.equal(a, 200); assert.equal(b, 429); assert.equal(j.code, "player_limit"); assert.match(j.error, /Volte amanhã/);
  delete process.env.PHOTOS_PER_PLAYER_PER_DAY;
});
await t("No key: scanner off, and no tickets can be made", async () => {
  delete process.env.ANTHROPIC_API_KEY;
  const [st, j] = await call({ image: IMG, lang: "es" }); assert.equal(st, 503); assert.equal(j.code, "no_key");
  assert.equal(common.makeTicket(), null); assert.equal((await pick(ticket))[0], 400);
});
await t("Only counters and ticket marks are stored: no photos, no IPs, no tickets", async () => {
  for (const [k, v] of store.m) {
    assert.ok(/^(photos\/\d{4}-\d{2}-\d{2}(\/[0-9a-f]{24})?|(players|items)\/\d{4}-\d{2}-\d{2}|types\/[a-z_]+|counter\/items|pickups\/total|pickups\/used\/\d{4}-\d{2}-\d{2}\/[0-9a-f]{24})$/.test(k), "unexpected key " + k);
    assert.ok(!String(v).includes("AAAA") && !k.includes("1.1.1.1") && !k.includes("9.9.9.9"), k);
  }
});
console.log(`\n${ok + 1} checks passed`);
