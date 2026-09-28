import * as cheerio from "cheerio";
import { parseJsonHtmlAttribute } from "../../../utils/parse-json-html-attribute/parseJsonHtmlAttribute.js";
import { parseStrippedDecimal } from "../../../utils/parse-stripped-decimal/parseStrippedDecimal.js";

interface AnalyticsData {
  clerk?: { price_original?: string };
}

/**
 * Цена со страницы: data-analytics → clerk.price_original.
 */
export function parseBalunHtmlPrice(html: string): number | undefined {
  const $ = cheerio.load(html);
  const analyticsAttr = $("[data-analytics]").first().attr("data-analytics");
  const analyticsData = parseJsonHtmlAttribute(analyticsAttr) as
    | AnalyticsData
    | undefined;
  const priceOriginal = analyticsData?.clerk?.price_original;
  if (priceOriginal === undefined || priceOriginal === "") {
    return undefined;
  }
  const price = parseStrippedDecimal(String(priceOriginal));
  return price === null ? undefined : price;
}
