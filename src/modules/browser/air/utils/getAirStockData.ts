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
 * Origin + "/" для Impit warm-up (cookies в jar до product GET).
 */
export function resolveAirWarmUpUrl(productUrl: string): string | undefined {
  if (!URL.canParse(productUrl)) {
    return undefined;
  }
  return `${new URL(productUrl).origin}/`;
}

/**
 * Получает данные о количестве и цене товара со страницы товара сайта air по ссылке.
 * При отсутствии товара в наличии (элемент #max-product-quantity отсутствует в разметке) возвращает stock: 0 при валидной цене.
 * При скидке цена берётся из .us-price-new, если .us-price-actual пуст.
 * Fetch: Impit (Chrome TLS/HTTP fingerprint + cookie jar) с origin warm-up и Referer;
 * adm.tools JS-challenge решается POST ack (`__ack` JSON / legacy `___ack`) внутри Impit;
 * опциональный HTTP-прокси.
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
  const warmUpUrl = resolveAirWarmUpUrl(productUrl);

  try {
    const html = await fetchPageHtml(productUrl, {
      konkName: "air",
      transport: "impit",
      proxyUrl: getAirHttpProxyUrl(),
      ...(warmUpUrl
        ? {
            warmUpUrl,
            headers: {
              Referer: warmUpUrl,
              "Sec-Fetch-Site": "same-origin",
            },
          }
        : {}),
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
