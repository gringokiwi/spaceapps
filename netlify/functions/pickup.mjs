/* POST /api/pickup {ticket} -> { pickups, counted }
   A child confirmed one pick-up ("It's in the bin!"). Each ticket from /api/scan adds exactly 1 to the
   shared total, once. Sending the same ticket again answers 200 with counted: false, so the phone can
   stop retrying. Nothing about the child, their place or their photo is sent or kept. */
import { json, read, add, checkTicket, PICKUPS } from "../lib/common.mjs";

const inFlight = new Set();   // the same ticket arriving twice at once counts once

export default async req => {
  if (req.method !== "POST") return json(405, { error: "Use POST.", code: "method" });
  let body; try { body = await req.json(); } catch { return json(400, { error: "That pick-up can't be counted.", code: "bad_json" }); }
  const c = checkTicket(body && body.ticket);
  if (!c.ok) return json(c.why === "expired" ? 410 : 400, { error: c.why === "expired" ? "That pick-up is too old to count." : "That pick-up can't be counted.", code: c.why });
  try {
    if (inFlight.has(c.id)) return json(200, { pickups: await read(PICKUPS), counted: false });
    inFlight.add(c.id);                       // reserved before the first await
    try {
      if (await read(c.usedKey)) return json(200, { pickups: await read(PICKUPS), counted: false });
      await add(c.usedKey);                   // mark the ticket used first, then count it
      return json(200, { pickups: await add(PICKUPS), counted: true });
    } finally { inFlight.delete(c.id); }
  } catch { return json(503, { error: "Couldn't count it right now. Try again later.", code: "store" }); }
};

export const config = { path: "/api/pickup" };
