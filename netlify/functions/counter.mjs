/* GET /api/counter -> { total, pickups, live }: numbers only, for everyone together.
   total   = pieces of litter found since counting began (the Live usage screen).
   pickups = pieces confirmed in the bin ("It's in the bin!") since pick-ups began: Home and the Impact screen.
   live    = today (UTC): players, photos scanned, pieces found; and pieces by type since counting began. */
import { json, read, today, PICKUPS } from "../lib/common.mjs";
const TYPES = ["plastic", "paper_cardboard", "can", "glass", "organic", "batteries_electronics", "chemicals", "sharp_object", "other"];
export default async () => {
  try {
    const day = today();
    const [total, pickups, players, photos, pieces, ...byType] = await Promise.all([read("counter/items"), read(PICKUPS), read(`players/${day}`), read(`photos/${day}`), read(`items/${day}`), ...TYPES.map(k => read(`types/${k}`))]);
    const types = {}; TYPES.forEach((k, i) => { types[k] = byType[i]; });
    return json(200, { total, pickups, live: { day, players, photos, pieces, types } });
  } catch { return json(503, { total: null, pickups: null, error: "Couldn't read the counter." }); }
};
export const config = { path: "/api/counter" };
