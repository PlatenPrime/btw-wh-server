const PRODUCT_ID_RE = /\/p(\d+)/i;

/**
 * Достаёт Prom productId из URL карточки company site (`/p1341824038-...`).
 */
export function extractPromUaProductId(link: string): string | undefined {
  const match = link.match(PRODUCT_ID_RE);
  return match?.[1];
}
