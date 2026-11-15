/* Shared pieces (adapted from isla-skills: netlify/lib/config.mjs and store.mjs, without payments). */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const int = (name, def) => { const v = parseInt(process.env[name], 10); return Number.isFinite(v) && v >= 0 ? v : def; };
/* Limits that protect the AI bill. */
export const PHOTOS_PER_DAY = () => int("PHOTOS_PER_DAY", 300);                        // all players together
export const PHOTOS_PER_PLAYER_PER_DAY = () => int("PHOTOS_PER_PLAYER_PER_DAY", 30);

export const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
export const today = () => new Date().toISOString().slice(0, 10);

/* The shared total of confirmed pick-ups ("It's in the bin!"), shown on Home and on the Impact screen.
   A fresh key: the old "counter/items" counted at scan time, dangerous finds included. */
export const PICKUPS = "pickups/total";

/* Pick-up tickets. /api/scan hands one out for each piece of litter that is safe to pick up;
   /api/pickup counts it once, when the child confirms the piece is in the bin. A ticket is only
   a random id and an expiry, signed by the server: nothing about the child, the place or the photo.
   The signing key comes from PICKUP_SECRET, or else from the API key, so it survives redeploys. */
export const TICKET_DAYS = 14;   // long enough for "No bin nearby? Save it for later"
function ticketKey() {
  const base = process.env.PICKUP_SECRET || process.env.ANTHROPIC_API_KEY;
  return base ? createHash("sha256").update("debris pick-up ticket v1:" + base).digest() : null;
}
export function makeTicket(now = Date.now()) {
  const key = ticketKey();
  if (!key) return null;
  const id = randomBytes(12).toString("hex"), exp = now + TICKET_DAYS * 86400000;
  return `${id}.${exp}.${createHmac("sha256", key).update(`${id}.${exp}`).digest("base64url")}`;
}
export function checkTicket(ticket, now = Date.now()) {
  const m = /^([0-9a-f]{24})\.(\d{13})\.([A-Za-z0-9_-]{43})$/.exec(String(ticket || ""));
  const key = ticketKey();
  if (!m || !key) return { ok: false, why: "bad" };
  const want = createHmac("sha256", key).update(`${m[1]}.${m[2]}`).digest(), got = Buffer.from(m[3], "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return { ok: false, why: "bad" };
  const exp = Number(m[2]);
  if (exp < now) return { ok: false, why: "expired" };
  return { ok: true, id: m[1], exp, usedKey: `pickups/used/${new Date(exp).toISOString().slice(0, 10)}/${m[1]}` };
}

/* The IP is only used hashed with the day, to count photos per player. It is never stored in clear. */
export function playerId(req, context) {
  const ip = (context && context.ip) || req.headers.get("x-nf-client-connection-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  return createHash("sha256").update(today() + ":" + ip).digest("hex").slice(0, 24);
}

/* Storage: Netlify Blobs on Netlify. server.mjs (Railway, or any Node host) sets a file or memory store
   through setStore(), and so do the tests. Only counters are ever stored, never photos. */
let impl = null;
export function setStore(s) { impl = s; }
async function db() {
  if (impl) return impl;
  // Ask for the store on every call: a store kept from an earlier request fails with "Token expired" (seen in isla-skills).
  const { getStore } = await import("@netlify/blobs");
  return getStore({ name: "patrulla-planeta", consistency: "strong" });
}
export async function read(key) { return Number(await (await db()).get(key, { type: "json" })) || 0; }
/* Read-modify-write (fine for a game: it isn't money). */
export async function add(key, by = 1) { const s = await db(); const v = (Number(await s.get(key, { type: "json" })) || 0) + by; await s.setJSON(key, v); return v; }

export function memoryStore() {
  const m = new Map();
  return { m,
    async get(k, o) { if (!m.has(k)) return null; const v = m.get(k); return o && o.type === "json" ? JSON.parse(v) : v; },
    async setJSON(k, v) { m.set(k, JSON.stringify(v)); } };
}

/* The counters in one JSON file, for a Node server with a disk that survives redeploys (a Railway volume).
   Writes are grouped and atomic (a temporary file, then a rename). Per-day photo counts older than
   yesterday, and marks of expired tickets, are dropped, so the file stays small. */
export function fileStore(file) {
  let data = {};
  try { data = JSON.parse(readFileSync(file, "utf8")) || {}; } catch { data = {}; }
  let timer = null;
  function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    const keep = new Set([today(), new Date(Date.now() - 86400000).toISOString().slice(0, 10)]);
    for (const k of Object.keys(data)) {
      const daily = /^(?:photos|players|items)\/(\d{4}-\d{2}-\d{2})/.exec(k), used = /^pickups\/used\/(\d{4}-\d{2}-\d{2})\//.exec(k);
      if (daily && !keep.has(daily[1])) delete data[k];
      else if (used && used[1] < today()) delete data[k];   // an expired ticket can't be counted again anyway
    }
    try { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file + ".tmp", JSON.stringify(data)); renameSync(file + ".tmp", file); }
    catch (e) { console.error("Couldn't save the counters:", e.message); }
  }
  return { file, flush,
    async get(k, o) { if (!Object.prototype.hasOwnProperty.call(data, k)) return null; return o && o.type === "json" ? data[k] : JSON.stringify(data[k]); },
    async setJSON(k, v) { data[k] = v; if (!timer) timer = setTimeout(flush, 300); } };
}
