import * as cheerio from "cheerio";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
import { GRABO_BASE_URL } from "../types/graboSkuData.js";

/**
 * Категории каталога из HTML sitemap: только дерево Products (`.site-map li.nav900`).
 * About Us / Catalogues / Premioloon и прочий level-0 не входят.
 */
export function parseGraboSitemapCategoryUrls(html: string): string[] {
  const $ = cheerio.load(html);
  const urls: string[] = [];
  const seen = new Set<string>();

  $(".site-map li.nav900 a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) {
      return;
    }
    const absolute = resolveHrefAgainstBase(href, GRABO_BASE_URL);
    if (!absolute || seen.has(absolute)) {
      return;
    }
    seen.add(absolute);
    urls.push(absolute);
  });

  return urls;
}
