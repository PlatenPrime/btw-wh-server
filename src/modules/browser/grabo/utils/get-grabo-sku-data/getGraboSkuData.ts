import { fetchGraboPageHtml } from "../fetch-grabo-page-html/fetchGraboPageHtml.js";
import type { GraboSkuData } from "../types/graboSkuData.js";
import { parseGraboSkuHtml } from "./parseGraboSkuHtml.js";

export type { GraboSkuData } from "../types/graboSkuData.js";
export { parseGraboSkuHtml } from "./parseGraboSkuHtml.js";

/**
 * Получает данные карточки товара Grabo по URL страницы.
 * Fetch через fetchGraboPageHtml (retry ETIMEDOUT), затем parseGraboSkuHtml.
 * @param link — URL страницы товара
 * @throws Error при пустом/не-строковом link; ошибки fetch пробрасываются
 */
export async function getGraboSkuData(link: string): Promise<GraboSkuData> {
  if (!link || typeof link !== "string") {
    throw new Error("Link is required and must be a string");
  }

  const html = await fetchGraboPageHtml(link.trim());
  return parseGraboSkuHtml(html);
}
