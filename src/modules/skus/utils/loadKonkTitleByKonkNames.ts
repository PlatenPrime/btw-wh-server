import { Konk } from "../../konks/models/Konk.js";

export async function loadKonkTitleByKonkNames(
  konkNames: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(konkNames.filter((n) => n.length > 0))];
  if (unique.length === 0) return new Map();

  const rows = await Konk.find({ name: { $in: unique } })
    .select("name title")
    .lean<{ name: string; title: string }[]>();

  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.name, row.title ?? "");
  }
  return map;
}
