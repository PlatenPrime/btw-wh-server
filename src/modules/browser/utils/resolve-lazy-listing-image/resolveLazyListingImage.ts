import type { BrowserCheerio } from "../cheerioTypes.js";
import { resolveHrefAgainstBase } from "../resolve-href-against-base/resolveHrefAgainstBase.js";

const LAZY_IMAGE_MARKER = "lazy-image.svg";

export type ResolveLazyListingImageOptions = {
  /** Использовать `data-src` после `data-srcset` (Air). */
  preferDataSrc?: boolean;
};

/**
 * URL картинки листинга: не-lazy `src`, иначе первый URL из `data-srcset`,
 * опционально `data-src`, иначе fallback на `src` (в т.ч. placeholder).
 */
export function resolveLazyListingImage(
  $img: BrowserCheerio,
  baseUrl: string,
  options: ResolveLazyListingImageOptions = {}
): string | null {
  const src = $img.attr("src")?.trim();
  const dataSrcset = $img.attr("data-srcset")?.trim();
  const dataSrc = options.preferDataSrc
    ? $img.attr("data-src")?.trim()
    : undefined;

  if (src && !src.includes(LAZY_IMAGE_MARKER)) {
    return resolveHrefAgainstBase(src, baseUrl);
  }

  if (dataSrcset) {
    const firstPart = dataSrcset.split(/\s+/)[0]?.trim();
    if (firstPart) {
      const resolved = resolveHrefAgainstBase(firstPart, baseUrl);
      if (resolved) {
        return resolved;
      }
    }
  }

  if (dataSrc) {
    return resolveHrefAgainstBase(dataSrc, baseUrl);
  }

  if (src) {
    return resolveHrefAgainstBase(src, baseUrl);
  }

  return null;
}
