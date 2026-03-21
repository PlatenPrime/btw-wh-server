/**
 * Канонический productId для Sku и ключей среза: `{konkLower}-{rawId}`.
 */
export function toCanonicalSkuProductId(
  konkName: string,
  rawProductId: string
): string {
  const k = konkName.trim().toLowerCase();
  const id = rawProductId.trim();
  return `${k}-${id}`;
}
