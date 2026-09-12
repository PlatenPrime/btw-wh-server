import { fetchPageHtml } from "../../utils/fetchPageHtml.js";
import { parseSvbumProductHtml } from "./svbum-parse-product-html/parseSvbumProductHtml.js";
import type { SvbumProductInfo } from "./svbum-product-types/svbumProductInfo.js";
import { SVBUM_NEGATIVE_OUTCOME } from "./svbum-product-types/svbumProductInfo.js";

export type { SvbumProductInfo } from "./svbum-product-types/svbumProductInfo.js";
export { extractSvbumPackCount } from "./svbum-pack-count/extractSvbumPackCount.js";
export { parseSvbumProductHtml } from "./svbum-parse-product-html/parseSvbumProductHtml.js";

/**
 * Остаток в штуках и цена за штуку со страницы товара sviatobum.ua.
 * @param link — URL страницы товара
 * @throws Error при пустом/не-строковом link
 */
export async function getSvbumStockData(link: string): Promise<SvbumProductInfo> {
  if (!link || typeof link !== "string") {
    throw new Error("Link is required and must be a string");
  }

  try {
    const html = await fetchPageHtml(link, { konkName: "svbum" });
    return parseSvbumProductHtml(html);
  } catch {
    return SVBUM_NEGATIVE_OUTCOME;
  }
}
