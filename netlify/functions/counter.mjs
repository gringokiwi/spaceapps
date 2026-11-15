/* GET /api/counter -> { total, live }: numbers only, for everyone together.
   total = pieces of litter found since counting began.
   live  = today (UTC): players, photos scanned, pieces found; and pieces by type since counting began. */
import { json, read, today } from "../lib/common.mjs";
const TYPES = ["plastic", "paper_cardboard", "can", "glass", "organic", "batteries_electronics", "chemicals", "sharp_object", "other"];
export default async () => {
  try {
    const day = today();
    const [total, players, photos, pieces, ...byType] = await Promise.all([read("counter/items"), read(`players/${day}`), read(`photos/${day}`), read(`items/${day}`), ...TYPES.map(k => read(`types/${k}`))]);
    const types = {}; TYPES.forEach((k, i) => { types[k] = byType[i]; });
    return json(200, { total, live: { day, players, photos, pieces, types } });
  } catch { return json(503, { total: null, error: "Couldn't read the counter." }); }
};
export const config = { path: "/api/counter" };
