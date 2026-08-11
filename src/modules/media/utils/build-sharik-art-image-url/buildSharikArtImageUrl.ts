export type SharikArtImageSize = "prev" | "big";

const SHARIK_BIG_BASE = "https://sharik.ua/images/elements_big";
const SHARIK_PREV_BASE = "https://sharik.ua/images/elements_big_prev";

/**
 * Строит upstream URL картинки артикула на sharik.ua.
 */
export function buildSharikArtImageUrl(
  artikul: string,
  size: SharikArtImageSize = "prev"
): string {
  const encoded = encodeURIComponent(artikul);
  if (size === "big") {
    return `${SHARIK_BIG_BASE}/${encoded}_m1.jpg`;
  }
  return `${SHARIK_PREV_BASE}/prev_${encoded}_m1.jpg`;
}
