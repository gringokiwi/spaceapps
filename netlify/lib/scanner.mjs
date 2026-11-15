/* Scanner: Claude (Haiku, with vision) looks at ONE photo and says whether it is trash.
   Adapted from Litter Spotter (netlify/lib/spotter.mjs in katamar-lang/isla-skills), without payments.
   It speaks as Eagle, the lander from the debris app, in the player's language.
   The ANTHROPIC_API_KEY lives only here, on the server. The photo is never stored. */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";

export const MODEL = "claude-haiku-5-5";
export const TYPES = ["plastic", "can", "paper_cardboard", "glass", "organic", "batteries_electronics", "chemicals", "sharp_object", "other", "none"];
/* Bins follow Colombia's colour code (Resolución 2184 de 2019):
   white = recyclables, green = organic, black = non-recyclable.
   "special_dropoff" = batteries, electronics, chemicals, needles, broken glass: an adult takes them to a collection point. */
export const BINS = ["white", "green", "black", "special_dropoff", "none"];
export const PHOTO_PROBLEMS = ["none", "screen", "people", "blurry"];
/* The languages the app speaks. */
export const LANGS = { en: "English", es: "Spanish (Latin American)", pt: "Brazilian Portuguese" };

export const ScanSchema = z.object({
  photo_problem: z.enum(PHOTO_PROBLEMS).describe("'screen' only if the photo is a picture OF a screen, so the object is being shown on a phone, computer, TV or tablet (a real object with a screen somewhere in the background is fine); 'people' if a person or face is in the foreground; 'blurry' if nothing can be seen clearly; otherwise 'none'"),
  is_trash: z.enum(["yes", "no", "unsure"]).describe("Is the main object in the photo trash that should be picked up?"),
  type: z.enum(TYPES).describe("Type of the main object; 'none' if there is no object or it is not trash"),
  bin: z.enum(BINS).describe("Where it goes: white (clean plastic, cans, paper, cardboard, glass), green (food scraps, peels), black (dirty napkins, dirty wrappers, cigarette butts), special_dropoff (batteries, electronics, chemicals, needles, broken glass), none if it is not trash"),
  dangerous: z.boolean().describe("true if a child must not touch it: broken glass, needles or syringes, sharp objects, chemicals, broken or leaking batteries"),
  item: z.string().describe("Everyday name of the main object, 1 to 4 words, in the language asked for, for example 'Plastic wrapper'; empty if there is no clear object"),
  message: z.string().describe("One short, kind sentence for a child aged 7 to 12, in the language asked for, at most 20 words")
});

const SYSTEM = `You are Eagle, a friendly lander who helps children aged 7 to 12 clean up their neighbourhood in a game called debris.
The child takes a photo of ONE object they found. You say whether it is trash, what type it is, and which bin it goes in.
Rules:
- Set photo_problem = "screen" only when the object itself is being shown on a screen (a photo of a phone, computer, TV or tablet displaying it). A real object on a desk with a laptop, monitor or phone somewhere around it is fine: judge the real object and keep photo_problem = "none".
- If a person or a face is in the foreground, set photo_problem = "people". Never describe people.
- If the photo is so blurry or dark that the object can't be seen, set photo_problem = "blurry".
- Natural things (leaves, stones, sticks, flowers, animals) are not trash. Things in use (a toy, a backpack, a phone on a table) are not trash either.
- If you can't tell whether it is trash, use is_trash = "unsure".
- dangerous = true for broken glass, needles or syringes, blades or sharp objects, chemicals or poison bottles, broken batteries. An unbroken glass bottle is not dangerous.
- Bins (Colombia's colour code): white for clean, dry plastic, cans, paper, cardboard and glass; green for food scraps and peels; black for dirty or non-recyclable things (used napkins, cigarette butts, wrappers with food); special_dropoff for batteries, electronics, chemicals, needles and broken glass.
- item: the everyday name of the main object in 1 to 4 simple words, in the language the user asks for, like "Plastic wrapper", "Juice box" or "Broken glass". Never name or describe a person.
- message: one short, cheerful, simple sentence for a child, in the language the user asks for. No hard words. If it is dangerous, say not to touch it and to call an adult.`;

let client = null;
export function setClaudeClient(c) { client = c; }
function getClient() {
  if (client) return client;
  if (!process.env.ANTHROPIC_API_KEY) throw Object.assign(new Error("ANTHROPIC_API_KEY is not set on the server"), { code: "no_key" });
  // Everything must fit in a Netlify Function's time limit: no retries and a short timeout.
  return (client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 9000, maxRetries: 0 }));
}

export async function scan(base64, mediaType, lang = "en") {
  const language = LANGS[lang] || LANGS.en;
  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    output_config: { effort: "low", format: zodOutputFormat(ScanSchema) },
    messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
      { type: "text", text: `Photo from a child who is cleaning up. What is it, and is it trash? Write the item and the message in ${language}.` }
    ] }]
  });
  if (response.stop_reason === "refusal") throw Object.assign(new Error("The AI declined to look at this photo"), { code: "refusal" });
  const out = response.parsed_output;
  if (!out) throw Object.assign(new Error("The AI answer couldn't be read"), { code: "bad_output" });
  return tidy(out);
}

/* Keep the result tidy and safe to show, even if the AI gets a field wrong. */
export function tidy(out) {
  const photo_problem = PHOTO_PROBLEMS.includes(out.photo_problem) ? out.photo_problem : "none";
  let is_trash = ["yes", "no", "unsure"].includes(out.is_trash) ? out.is_trash : "unsure";
  let type = TYPES.includes(out.type) ? out.type : "other";
  let bin = BINS.includes(out.bin) ? out.bin : "black";
  // Dangerous by type, even if the AI forgets.
  const dangerous = out.dangerous === true || type === "sharp_object" || type === "chemicals";
  if (dangerous) { is_trash = "yes"; bin = "special_dropoff"; }
  if (is_trash === "no") { type = "none"; bin = "none"; }
  if (is_trash === "yes" && type === "none") type = "other";
  const clean = (s, max) => String(s || "").replace(/\s+/g, " ").trim().slice(0, max);
  // No name for photos that can't be used: they may show a person or a screen.
  const item = photo_problem === "none" ? clean(out.item, 40) : "";
  const message = clean(out.message, 160);
  return { photo_problem, is_trash, type, bin, dangerous, item, message };
}
