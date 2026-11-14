/* Shared pieces (adapted from isla-skills: netlify/lib/config.mjs and store.mjs, without payments). */
import { createHash } from "node:crypto";

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

/* Storage: Netlify Blobs. Tests use an in-memory store through setStore(). */
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
