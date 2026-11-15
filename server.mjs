/* debris as one Node server, for Railway or any host that runs `npm start`.
   It serves the app's files and the same API routes as the Netlify functions:
   POST /api/scan, POST /api/pickup, GET /api/counter, and GET /api/health for the host's health check.
   The counters go in a JSON file on a volume (RAILWAY_VOLUME_MOUNT_PATH, or STORE_DIR);
   without a volume they live in memory and start again from zero after each deploy. */
import http from "node:http";
import { createReadStream, promises as fsp } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import scan from "./netlify/functions/scan.mjs";
import counter from "./netlify/functions/counter.mjs";
import pickup from "./netlify/functions/pickup.mjs";
import { setStore, memoryStore, fileStore } from "./netlify/lib/common.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY = 2 * 1024 * 1024; // the page sends photos of at most ~1 MB

const storeDir = process.env.STORE_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH;
const store = storeDir ? fileStore(path.join(storeDir, "debris-counters.json")) : memoryStore();
setStore(store);

/* Only the app's own files are served: never the server code, node_modules or anything hidden. */
const FILES = new Set(["index.html", "style.css", "game.js", "art.js", "impact.js", "jacket3d.js", "content.json", "boi.json"]);
const FOLDERS = ["img/", "docs/", "fonts/"];
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".glb": "model/gltf-binary", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".md": "text/markdown; charset=utf-8", ".woff2": "font/woff2" };
const SECURITY = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data: blob: https:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
};

const API = { "/api/scan": scan, "/api/counter": counter, "/api/pickup": pickup };

function send(res, status, body, headers = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, { "Content-Type": typeof body === "string" ? "text/plain; charset=utf-8" : "application/json", "Cache-Control": "no-store", ...SECURITY, ...headers });
  res.end(text);
}

/* The visitor's address, only used hashed with the day for the per-player photo limit (see playerId). */
function clientIp(req) {
  const real = String(req.headers["x-real-ip"] || "").trim();
  if (real) return real;
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket.remoteAddress || "unknown";
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw Object.assign(new Error("too large"), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function api(req, res, handler) {
  let body;
  if (req.method === "POST") {
    try { body = await readBody(req); }
    catch { return send(res, 413, { error: "The photo is too big.", code: "too_large" }); }
  }
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (v != null) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
  const request = new Request(`http://${req.headers.host || "localhost"}${req.url}`, { method: req.method, headers, body: body && body.length ? body : undefined });
  const response = await handler(request, { ip: clientIp(req) });
  res.writeHead(response.status, { ...Object.fromEntries(response.headers), ...SECURITY });
  res.end(Buffer.from(await response.arrayBuffer()));
}

async function file(req, res, pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname).replace(/^\/+/, "") || "index.html"; } catch { return send(res, 400, "Bad address."); }
  const parts = rel.split("/");
  if (rel.includes("\0") || parts.some(p => p === ".." || p.startsWith(".")) || !(FILES.has(rel) || FOLDERS.some(f => rel.startsWith(f)))) return send(res, 404, "Not found.");
  const full = path.join(ROOT, rel);
  if (!full.startsWith(ROOT + path.sep)) return send(res, 404, "Not found.");
  let st;
  try { st = await fsp.stat(full); } catch { return send(res, 404, "Not found."); }
  if (!st.isFile()) return send(res, 404, "Not found.");
  // A file the phone already has comes back as "304 Not Modified" (no body), so a repeat visit doesn't download it again
  const etag = `W/"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
  // The font never changes (a new one gets a new name), so phones keep it for a year; everything else is checked on each visit
  const headers = { "Content-Type": TYPES[path.extname(full).toLowerCase()] || "application/octet-stream", "Cache-Control": rel.startsWith("fonts/") ? "public, max-age=31536000, immutable" : "no-cache", ETag: etag, ...SECURITY };
  if (String(req.headers["if-none-match"] || "").split(/\s*,\s*/).includes(etag)) { res.writeHead(304, headers); return res.end(); }
  res.writeHead(200, { ...headers, "Content-Length": st.size });
  if (req.method === "HEAD") return res.end();
  createReadStream(full).on("error", () => res.destroy()).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, "http://localhost");
    if (pathname === "/api/health") return send(res, 200, { ok: true });
    if (API[pathname]) return await api(req, res, API[pathname]);
    if (pathname.startsWith("/api/")) return send(res, 404, { error: "Not found.", code: "not_found" });
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Use GET.", { Allow: "GET, HEAD" });
    return await file(req, res, pathname);
  } catch (e) {
    console.error("Request failed:", e && e.message);
    if (!res.headersSent) send(res, 500, { error: "Something went wrong. Try again.", code: "server_error" });
    else res.destroy();
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`debris is running on port ${PORT}.`);
  console.log(storeDir ? `Counters are saved in ${path.join(storeDir, "debris-counters.json")}.` : "No volume: the counters are kept in memory and reset on each deploy.");
  if (!process.env.ANTHROPIC_API_KEY) console.log("ANTHROPIC_API_KEY is not set: the scanner is off. The app still runs, and ?demo works.");
});

/* Railway stops the old copy with SIGTERM on each deploy: save the counters first. */
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    if (store.flush) store.flush();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  });
}
