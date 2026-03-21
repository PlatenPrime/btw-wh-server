import { getYumiGroupPagesProducts } from "../yumi/group-pages/utils/getYumiGroupPagesProducts.js";
import type { FetchGroupProductsInput, GroupBrowserProduct } from "./types.js";

export class UnsupportedKonkForGroupProductsError extends Error {
  constructor(public readonly konkName: string) {
    super(`Group products fetch is not implemented for konkName: ${konkName}`);
    this.name = "UnsupportedKonkForGroupProductsError";
  }
}

/**
 * По имени конкурента вызывает соответствующую утилиту обхода страниц группы.
 * Для air / balun / sharte — добавить ветки по мере готовности парсеров.
 */
export async function fetchGroupProductsByKonkName(
  konkName: string,
  input: FetchGroupProductsInput
): Promise<GroupBrowserProduct[]> {
  const normalized = konkName.trim().toLowerCase();

  switch (normalized) {
    case "yumi": {
      const rows = await getYumiGroupPagesProducts({
        groupUrl: input.groupUrl,
        ...(input.maxPages !== undefined && { maxPages: input.maxPages }),
      });
      return rows.map((p) => ({
        title: p.title,
        url: p.url,
        imageUrl: p.imageUrl,
      }));
    }
    // case "air":
    // case "balun":
    // case "sharte":
    default:
      throw new UnsupportedKonkForGroupProductsError(konkName);
  }
}
