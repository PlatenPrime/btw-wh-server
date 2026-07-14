import { browserGet, logBrowserError } from "../../utils/browserRequest.js";
import type { AirProductInfo } from "./air-product-types/airProductInfo.js";
import { readAirProductFromHtml } from "./air-product-page-from-html/readAirProductFromHtml.js";
import { getAirHttpProxyUrl } from "./getAirHttpProxyUrl.js";

export type { AirProductInfo } from "./air-product-types/airProductInfo.js";

const NEGATIVE_OUTCOME: AirProductInfo = { stock: -1, price: -1 };

/**
 * Получает данные о количестве и цене товара со страницы товара сайта air по ссылке.
 * При отсутствии товара в наличии (элемент #max-product-quantity отсутствует в разметке) возвращает stock: 0 при валидной цене.
 * При скидке цена берётся из .us-price-new, если .us-price-actual пуст.
 * HTTP-запросы идут через `AIR_HTTP_PROXY_URL`, если задан.
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

  try {
    const html = await browserGet<string>(link, {
      proxyUrl: getAirHttpProxyUrl(),
    });
    return readAirProductFromHtml(html);
  } catch (error) {
    logBrowserError("Error fetching data from air product page:", error);
    return NEGATIVE_OUTCOME;
  }
}
