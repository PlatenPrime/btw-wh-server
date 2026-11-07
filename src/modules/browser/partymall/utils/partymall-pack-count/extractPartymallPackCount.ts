import type { BrowserCheerioAPI } from "../../../utils/cheerioTypes.js";

const PACK_LABEL_RE = /кількість\s+в\s+упаковці/i;

/**
 * Читает «Кількість в упаковці» из `.ds-product-attributes-item`.
 * Без атрибута — null (не угадывать из title).
 */
export function extractPartymallPackCount($: BrowserCheerioAPI): number | null {
  let found: number | null = null;

  $(".ds-product-attributes-item").each((_, el) => {
    if (found !== null) {
      return;
    }
    const $item = $(el);
    const label = $item.find(".secondary-text").first().text().replace(/\s+/g, " ").trim();
    if (!PACK_LABEL_RE.test(label)) {
      return;
    }
    const raw = $item.find(".fw-500").first().text().replace(/\s+/g, " ").trim();
    const match = raw.match(/(\d+)/);
    if (!match?.[1]) {
      return;
    }
    const count = parseInt(match[1], 10);
    if (Number.isFinite(count) && count > 0) {
      found = count;
    }
  });

  return found;
}
