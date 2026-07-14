import * as cheerio from "cheerio";

export function parseStockFromDom($: cheerio.CheerioAPI): number {
  const statusElement = $('[data-qaid="product_status_sticky_panel"]').first();

  if (statusElement.length > 0) {
    const raw = statusElement.attr("title") ?? statusElement.text();
    const text = raw.trim().toLowerCase();

    if (!text) {
      return 0;
    }

    if (text.includes("немає в наявності") || text.includes("нет в наличии")) {
      return 0;
    }

    if (text.includes("в наявності") || text.includes("в наличии")) {
      const numberMatch = text.match(/\d+/g);
      if (numberMatch && numberMatch.length > 0) {
        const parsed = parseInt(numberMatch[0], 10);
        if (Number.isFinite(parsed) && parsed >= 0) {
          return parsed;
        }
      }
    }
  }

  const quantityInput = $('input[name="quantity_input"]').first();
  const maxAttr = quantityInput.attr("max");
  if (maxAttr && maxAttr.trim() !== "") {
    const parsed = parseInt(maxAttr.trim(), 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return 0;
}
