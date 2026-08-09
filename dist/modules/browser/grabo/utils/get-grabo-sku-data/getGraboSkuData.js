import { fetchPageHtml } from "../../../utils/fetchPageHtml.js";
import { parseGraboSkuHtml } from "./parseGraboSkuHtml.js";
export { parseGraboSkuHtml } from "./parseGraboSkuHtml.js";
/**
 * Получает данные карточки товара Grabo по URL страницы.
 * Fetch через fetchPageHtml (konkName: grabo), затем parseGraboSkuHtml.
 * @param link — URL страницы товара
 * @throws Error при пустом/не-строковом link; ошибки fetch пробрасываются
 */
export async function getGraboSkuData(link) {
    if (!link || typeof link !== "string") {
        throw new Error("Link is required and must be a string");
    }
    const html = await fetchPageHtml(link.trim(), { konkName: "grabo" });
    return parseGraboSkuHtml(html);
}
