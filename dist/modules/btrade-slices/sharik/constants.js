const DEFAULT_PRODUCT_RESTS_SEED_ARTIKUL = "1302-0065";
export const SHARIK_PRODUCT_RESTS_BASE_URL = "https://sharik.ua/product_rests";
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
