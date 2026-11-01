import { Konk } from "../../konks/models/Konk.js";

type KonkLean = {
  name: string;
  title: string;
  recountDays?: string[];
};

export type KonkDisplayMeta = {
  title: string;
  recountDays: string[];
};

/**
 * Заголовки конкурентов и recountDays по `Konk.name`.
 * Нет документа — title = name, recountDays = [].
 */
export async function loadKonkDisplayMetaByName(
  names: string[],
): Promise<Map<string, KonkDisplayMeta>> {
  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n.length > 0))];
  const map = new Map<string, KonkDisplayMeta>();
  if (unique.length === 0) return map;

  const docs = await Konk.find({ name: { $in: unique } })
    .select("name title recountDays")
    .lean<KonkLean[]>();

  for (const doc of docs) {
    const name = (doc.name ?? "").trim();
    if (!name) continue;
    const title = (doc.title ?? "").trim();
    map.set(name, {
      title: title || name,
      recountDays: (doc.recountDays ?? []).map(String),
    });
  }

  for (const name of unique) {
    if (!map.has(name)) {
      map.set(name, { title: name, recountDays: [] });
    }
  }

  return map;
}
