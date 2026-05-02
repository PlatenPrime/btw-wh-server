import { browserGet } from "../../utils/browserRequest.js";
import type { YuminProductInfo } from "./yumin-product-types/yuminProductInfo.js";
import { YUMIN_NEGATIVE_OUTCOME } from "./yumin-product-types/yuminProductInfo.js";
import { parseYuminProductHtml } from "./yumin-parse-product-html/parseYuminProductHtml.js";

export type { YuminProductInfo } from "./yumin-product-types/yuminProductInfo.js";
export { extractPieceCountFromTitle } from "./yumin-piece-count-from-title/extractPieceCountFromTitle.js";
export { parseYuminProductHtml } from "./yumin-parse-product-html/parseYuminProductHtml.js";

/**
 * Получает данные о количестве (в штуках при наличии «(Nшт)» в названии) и цене за штуку со страницы товара.
 * @param link — URL страницы товара
 * @throws Error при пустом/не-строковом link
 */
export async function getYuminStockData(link: string): Promise<YuminProductInfo> {
  if (!link || typeof link !== "string") {
    throw new Error("Link is required and must be a string");
  }

  try {
    const html = await browserGet<string>(link);
    return parseYuminProductHtml(html);
  } catch {
    return YUMIN_NEGATIVE_OUTCOME;
  }
}
