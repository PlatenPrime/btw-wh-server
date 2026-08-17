import { GRABO_BASE_URL } from "../types/graboSkuData.js";

/**
 * Листинги каталога, которых нет в HTML sitemap Products.
 * Обход мержит их в общий список категорий с дедупом.
 */
export const GRABO_EXTRA_CATEGORY_URLS: readonly string[] = [
  `${GRABO_BASE_URL}/en/plates`,
  `${GRABO_BASE_URL}/en/napkins`,
  `${GRABO_BASE_URL}/en/banner`,
  `${GRABO_BASE_URL}/en/paper-cups`,
];

/**
 * Sitemap-категории, затем extras, которых ещё нет. Порядок sitemap сохраняется.
 */
export function mergeGraboCategoryUrls(
  sitemapUrls: readonly string[],
  extraUrls: readonly string[]
): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const url of sitemapUrls) {
    if (seen.has(url)) {
      continue;
    }
    seen.add(url);
    urls.push(url);
  }

  for (const url of extraUrls) {
    if (seen.has(url)) {
      continue;
    }
    seen.add(url);
    urls.push(url);
  }

  return urls;
}
