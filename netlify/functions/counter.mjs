/* GET /api/counter -> { total }: items picked up by all players together (just one number). */
import { json, read } from "../lib/common.mjs";
export default async () => {
  try { return json(200, { total: await read("counter/items") }); }
  catch { return json(503, { total: null, error: "Couldn't read the counter." }); }
};
export const config = { path: "/api/counter" };
