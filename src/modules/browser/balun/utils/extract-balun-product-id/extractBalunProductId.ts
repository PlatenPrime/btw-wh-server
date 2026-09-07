const PRODUCT_ID_RE = /\/p(\d+)/i;

/**
 * Достаёт Prom productId из URL карточки Balun (`/p1341824038-...`).
 */
export function extractBalunProductId(link: string): string | undefined {
  const match = link.match(PRODUCT_ID_RE);
  return match?.[1];
}
