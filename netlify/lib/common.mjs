/* Shared pieces (adapted from isla-skills: netlify/lib/config.mjs and store.mjs, without payments). */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const int = (name, def) => { const v = parseInt(process.env[name], 10); return Number.isFinite(v) && v >= 0 ? v : def; };
/* Limits that protect the AI bill. */
export const PHOTOS_PER_DAY = () => int("PHOTOS_PER_DAY", 300);                        // all players together
export const PHOTOS_PER_PLAYER_PER_DAY = () => int("PHOTOS_PER_PLAYER_PER_DAY", 30);

export const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
export const today = () => new Date().toISOString().slice(0, 10);

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
   yesterday are dropped, so the file stays small. */
export function fileStore(file) {
  let data = {};
  try { data = JSON.parse(readFileSync(file, "utf8")) || {}; } catch { data = {}; }
  let timer = null;
  function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    const keep = new Set([today(), new Date(Date.now() - 86400000).toISOString().slice(0, 10)]);
    for (const k of Object.keys(data)) { const m = /^photos\/(\d{4}-\d{2}-\d{2})/.exec(k); if (m && !keep.has(m[1])) delete data[k]; }
    try { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file + ".tmp", JSON.stringify(data)); renameSync(file + ".tmp", file); }
    catch (e) { console.error("Couldn't save the counters:", e.message); }
  }
  return { file, flush,
    async get(k, o) { if (!Object.prototype.hasOwnProperty.call(data, k)) return null; return o && o.type === "json" ? data[k] : JSON.stringify(data[k]); },
    async setJSON(k, v) { data[k] = v; if (!timer) timer = setTimeout(flush, 300); } };
}
