/**
 * Канонический productId для Sku и ключей среза: `{konkLower}-{rawId}`.
 */
export function toCanonicalSkuProductId(konkName, rawProductId) {
    const k = konkName.trim().toLowerCase();
    const id = rawProductId.trim();
    return `${k}-${id}`;
}
