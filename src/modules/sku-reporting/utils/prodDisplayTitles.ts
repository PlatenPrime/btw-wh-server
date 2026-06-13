import { Prod } from "../../prods/models/Prod.js";

export const isAllProd = (prod: string | undefined): boolean =>
  typeof prod === "string" && prod.trim() === "all";

type ProdLean = {
  name: string;
  title: string;
};

/**
 * Заголовки производителей для Excel: `Prod.title` по `name`, иначе fallback на `name`.
 */
export async function loadProdDisplayTitlesByName(
  names: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n.length > 0))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const docs = await Prod.find({ name: { $in: unique } })
    .select("name title")
    .lean<ProdLean[]>();

  for (const doc of docs) {
    const name = (doc.name ?? "").trim();
    if (!name) continue;
    const title = (doc.title ?? "").trim();
    map.set(name, title || name);
  }

  for (const name of unique) {
    if (!map.has(name)) map.set(name, name);
  }

  return map;
}
