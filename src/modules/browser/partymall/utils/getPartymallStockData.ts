import { fetchPageHtml } from "../../utils/fetchPageHtml.js";
import { parsePartymallProductHtml } from "./partymall-parse-product-html/parsePartymallProductHtml.js";
import type { PartymallProductInfo } from "./partymall-product-types/partymallProductInfo.js";
import { PARTYMALL_NEGATIVE_OUTCOME } from "./partymall-product-types/partymallProductInfo.js";

export type { PartymallProductInfo } from "./partymall-product-types/partymallProductInfo.js";
export { extractPartymallPackCount } from "./partymall-pack-count/extractPartymallPackCount.js";
export { parsePartymallProductHtml } from "./partymall-parse-product-html/parsePartymallProductHtml.js";

/**
 * Остаток с витрины и цена за штуку со страницы товара partymall.ua.
 * @param link — URL страницы товара
 * @throws Error при пустом/не-строковом link
 */
export async function getPartymallStockData(link: string): Promise<PartymallProductInfo> {
  if (!link || typeof link !== "string") {
    throw new Error("Link is required and must be a string");
  }

  try {
    const html = await fetchPageHtml(link, { konkName: "partymall" });
    return parsePartymallProductHtml(html);
  } catch {
    return PARTYMALL_NEGATIVE_OUTCOME;
  }
}
