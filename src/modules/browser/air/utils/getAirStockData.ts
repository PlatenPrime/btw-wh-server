import { createLogger } from "../../../../logging/createLogger.js";
import { logBrowserError } from "../../utils/browserRequest.js";
import { fetchPageHtml } from "../../utils/fetchPageHtml.js";
import { logBrowserStockResult } from "../../utils/logBrowserStockResult.js";
import type { AirProductInfo } from "./air-product-types/airProductInfo.js";
import { readAirProductFromHtml } from "./air-product-page-from-html/readAirProductFromHtml.js";
import { getAirHttpProxyUrl } from "./getAirHttpProxyUrl.js";
import { summarizeAirHtmlForLog } from "./summarize-air-html-for-log/summarizeAirHtmlForLog.js";

export type { AirProductInfo } from "./air-product-types/airProductInfo.js";

const NEGATIVE_OUTCOME: AirProductInfo = { stock: -1, price: -1 };
const airLog = createLogger({ module: "browser" });

/**
 * Получает данные о количестве и цене товара со страницы товара сайта air по ссылке.
 * При отсутствии товара в наличии (элемент #max-product-quantity отсутствует в разметке) возвращает stock: 0 при валидной цене.
 * При скидке цена берётся из .us-price-new, если .us-price-actual пуст.
 * Fetch: Impit (Chrome TLS/HTTP fingerprint); опциональный HTTP-прокси.
 * HTTP ≥ 400 на product → ошибка; успешный HTML без цены/стока → warn + `-1/-1`.
 * @param link — URL страницы товара
 * @returns Promise с объектом { stock, price }; при негативном исходе — { stock: -1, price: -1 }
 * @throws Error при пустом/не-строковом link
 */
export async function getAirStockData(
  link: string
): Promise<AirProductInfo> {
  if (!link || typeof link !== "string") {
    throw new Error("Link is required and must be a string");
  }

  const productUrl = link.trim();

  try {
    const html = await fetchPageHtml(productUrl, {
      konkName: "air",
      transport: "impit",
      proxyUrl: getAirHttpProxyUrl(),
    });
    const parsed = readAirProductFromHtml(html);
    if (parsed.stock === -1 && parsed.price === -1) {
      const summary = summarizeAirHtmlForLog(html);
      airLog.warn(
        {
          context: "Air stock HTML parsed to -1/-1",
          link: productUrl,
          ...summary,
        },
        "air stock parse negative"
      );
    }
    logBrowserStockResult({
      konkName: "air",
      link: productUrl,
      stock: parsed.stock,
      price: parsed.price,
    });
    return parsed;
  } catch (error) {
    logBrowserError("Error fetching data from air product page:", error);
    return NEGATIVE_OUTCOME;
  }
}
