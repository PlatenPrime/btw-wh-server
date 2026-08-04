const DEFAULT_PRODUCT_RESTS_SEED_ARTIKUL = "1302-0065";
export const SHARIK_PRODUCT_RESTS_BASE_URL = "https://sharik.ua/product_rests";
/** TTL in-memory cache product_rests (данные на сайте обновляются hourly). */
export const SHARIK_PRODUCT_RESTS_CACHE_TTL_MS = 60 * 60 * 1000;
/**
 * Артикул в URL страницы product_rests (полный каталог остатков/цен).
 * Переопределяется через BTRADE_SHARIK_PRODUCT_RESTS_SEED_ARTIKUL.
 */
export function getProductRestsSeedArtikul() {
    const fromEnv = process.env.BTRADE_SHARIK_PRODUCT_RESTS_SEED_ARTIKUL?.trim();
    return fromEnv || DEFAULT_PRODUCT_RESTS_SEED_ARTIKUL;
}
export function buildProductRestsUrl(seedArtikul) {
    return `${SHARIK_PRODUCT_RESTS_BASE_URL}/${encodeURIComponent(seedArtikul)}/`;
}
