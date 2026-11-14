/* POST /api/scan {image: "data:image/jpeg;base64,..."}
   -> { result: {photo_problem, is_trash, type, bin, dangerous, message}, counts, retake, total }
   The photo goes to Claude and is forgotten: it is never written to storage or logs. */
import { json, today, playerId, read, add, PHOTOS_PER_DAY, PHOTOS_PER_PLAYER_PER_DAY } from "../lib/common.mjs";
import { scan } from "../lib/scanner.mjs";

const MAX_CHARS = 1_400_000; // ~1 MB of JPEG; the page shrinks photos first (≤ 1024 px)
const err = (status, error, code) => json(status, { error, code });

/* When the photo can't be used: it doesn't count and the player is asked for another one. */
const RETAKE = {
  screen: "That looks like a screen. Take a photo of the real object, not a screen!",
  people: "I can see a person. Take the photo of just the object, with no people.",
  blurry: "I can't see it well. Get a bit closer and take another photo with more light."
};

export default async (req, context) => {
  if (req.method !== "POST") return err(405, "Use POST.", "method");
  if (!process.env.ANTHROPIC_API_KEY) return err(503, "The scanner isn't switched on yet.", "no_key");
  let body; try { body = await req.json(); } catch { return err(400, "I couldn't read the photo.", "bad_json"); }
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(body && body.image || ""));
  if (!m) return err(400, "Send the photo as a JPEG, PNG or WebP.", "bad_image");
  if (m[2].length > MAX_CHARS) return err(413, "The photo is too big.", "too_large");

  const day = today(), me = playerId(req, context);
  const [all, mine] = await Promise.all([read(`photos/${day}`), read(`photos/${day}/${me}`)]).catch(() => [0, 0]);
  if (all >= PHOTOS_PER_DAY()) return err(429, "Spark has looked at lots of photos today. Come back tomorrow!", "daily_limit");
  if (mine >= PHOTOS_PER_PLAYER_PER_DAY()) return err(429, "You've used all your photos for today. Thanks for cleaning up! Come back tomorrow.", "player_limit");
  // Count the photo before calling the AI: the limit protects the real bill.
  await Promise.all([add(`photos/${day}`), add(`photos/${day}/${me}`)]).catch(() => {});

  let r;
  try { r = await scan(m[2], m[1]); }
  catch (e) { return err(502, "Spark couldn't look at the photo. Try again.", e.code || "ai_failed"); }

  if (r.photo_problem !== "none") return json(200, { result: { ...r, message: RETAKE[r.photo_problem] }, counts: false, retake: true });
  const counts = r.is_trash === "yes";
  let total = null;
  if (counts) total = await add("counter/items").catch(() => null);
  return json(200, { result: r, counts, retake: false, total });
};

export const config = { path: "/api/scan" };
