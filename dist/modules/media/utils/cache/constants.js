/** TTL in-memory кеша JPEG sharik (~1 час). */
export const SHARIK_ART_IMAGE_CACHE_TTL_MS = 60 * 60 * 1000;
/** Максимум записей LRU (ключ = size:artikul). */
export const SHARIK_ART_IMAGE_CACHE_MAX_ENTRIES = 500;
/** HTTP Cache-Control для успешного ответа клиенту. */
export const SHARIK_ART_IMAGE_HTTP_CACHE_CONTROL = "public, max-age=86400";
