/* POST /api/scan {image: "data:image/jpeg;base64,...", lang: "en" | "es" | "pt"}
   -> { result: {photo_problem, is_trash, type, bin, dangerous, message}, counts, retake, total }
   The photo goes to Claude and is forgotten: it is never written to storage or logs. */
import { json, today, playerId, read, add, PHOTOS_PER_DAY, PHOTOS_PER_PLAYER_PER_DAY } from "../lib/common.mjs";
import { scan } from "../lib/scanner.mjs";

const MAX_CHARS = 1_400_000; // ~1 MB of JPEG; the page shrinks photos first (≤ 1024 px)
const err = (status, error, code) => json(status, { error, code });

/* Words the player reads, in English, Spanish and Portuguese. */
const T = {
  en: { method: "Use POST.", nokey: "The scanner isn't switched on yet.", badjson: "I couldn't read the photo.", badimg: "Send the photo as a JPEG, PNG or WebP.", big: "The photo is too big.",
    day: "Spark has looked at lots of photos today. Come back tomorrow!", mine: "You've used all your photos for today. Thanks for cleaning up! Come back tomorrow.", ai: "Spark couldn't look at the photo. Try again.",
    screen: "That looks like a screen. Take a photo of the real object, not a screen!", people: "I can see a person. Take the photo of just the object, with no people.", blurry: "I can't see it well. Get a bit closer and take another photo with more light." },
  es: { method: "Usa POST.", nokey: "El escáner todavía no está encendido.", badjson: "No pude leer la foto.", badimg: "Manda la foto como JPEG, PNG o WebP.", big: "La foto es muy grande.",
    day: "Spark ya miró muchas fotos hoy. ¡Vuelve mañana!", mine: "Ya usaste tus fotos de hoy. ¡Gracias por limpiar! Vuelve mañana.", ai: "Spark no pudo mirar la foto. Intenta otra vez.",
    screen: "Eso parece una pantalla. ¡Toma una foto del objeto de verdad, no de una pantalla!", people: "Veo a una persona. Toma la foto solo del objeto, sin personas.", blurry: "No logro verlo bien. Acércate un poco y toma otra foto con más luz." },
  pt: { method: "Use POST.", nokey: "O scanner ainda não está ligado.", badjson: "Não consegui ler a foto.", badimg: "Mande a foto como JPEG, PNG ou WebP.", big: "A foto é grande demais.",
    day: "O Spark já olhou muitas fotos hoje. Volte amanhã!", mine: "Você já usou suas fotos de hoje. Obrigado por limpar! Volte amanhã.", ai: "O Spark não conseguiu olhar a foto. Tente de novo.",
    screen: "Isso parece uma tela. Tire uma foto do objeto de verdade, não de uma tela!", people: "Estou vendo uma pessoa. Tire a foto só do objeto, sem pessoas.", blurry: "Não estou vendo bem. Chegue um pouco mais perto e tire outra foto com mais luz." }
};

export default async (req, context) => {
  let t = T.en;
  if (req.method !== "POST") return err(405, t.method, "method");
  let body; try { body = await req.json(); } catch { return err(400, t.badjson, "bad_json"); }
  const lang = T[body && body.lang] ? body.lang : "en"; t = T[lang];
  if (!process.env.ANTHROPIC_API_KEY) return err(503, t.nokey, "no_key");
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(body && body.image || ""));
  if (!m) return err(400, t.badimg, "bad_image");
  if (m[2].length > MAX_CHARS) return err(413, t.big, "too_large");

  const day = today(), me = playerId(req, context);
  const [all, mine] = await Promise.all([read(`photos/${day}`), read(`photos/${day}/${me}`)]).catch(() => [0, 0]);
  if (all >= PHOTOS_PER_DAY()) return err(429, t.day, "daily_limit");
  if (mine >= PHOTOS_PER_PLAYER_PER_DAY()) return err(429, t.mine, "player_limit");
  // Count the photo before calling the AI: the limit protects the real bill.
  await Promise.all([add(`photos/${day}`), add(`photos/${day}/${me}`)]).catch(() => {});

  let r;
  try { r = await scan(m[2], m[1], lang); }
  catch (e) { return err(502, t.ai, e.code || "ai_failed"); }

  if (r.photo_problem !== "none") return json(200, { result: { ...r, message: t[r.photo_problem] }, counts: false, retake: true });
  const counts = r.is_trash === "yes";
  let total = null;
  if (counts) total = await add("counter/items").catch(() => null);
  return json(200, { result: r, counts, retake: false, total });
};

export const config = { path: "/api/scan" };
