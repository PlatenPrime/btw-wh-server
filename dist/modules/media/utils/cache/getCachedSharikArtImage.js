import { fetchSharikArtImage } from "../fetch-sharik-art-image/fetchSharikArtImage.js";
import { SHARIK_ART_IMAGE_CACHE_MAX_ENTRIES, SHARIK_ART_IMAGE_CACHE_TTL_MS, } from "./constants.js";
const cache = new Map();
const inflight = new Map();
export function buildSharikArtImageCacheKey(size, artikul) {
    return `${size}:${artikul}`;
}
export function buildSharikArtImageEtag(size, artikul, buffer, fetchedAt) {
    return `"${size}-${artikul}-${buffer.length}-${fetchedAt}"`;
}
function isFresh(entry, now) {
    return now - entry.fetchedAt < SHARIK_ART_IMAGE_CACHE_TTL_MS;
}
function touchLru(key, entry) {
    cache.delete(key);
    cache.set(key, entry);
}
function evictOldestIfNeeded() {
    while (cache.size >= SHARIK_ART_IMAGE_CACHE_MAX_ENTRIES) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey === undefined) {
            break;
        }
        cache.delete(oldestKey);
    }
}
/**
 * In-memory LRU + TTL кеш JPEG sharik. Параллельные miss на один key делят inflight.
 */
export async function getCachedSharikArtImage(artikul, size) {
    const key = buildSharikArtImageCacheKey(size, artikul);
    const now = Date.now();
    const hit = cache.get(key);
    if (hit && isFresh(hit, now)) {
        touchLru(key, hit);
        return hit;
    }
    const pending = inflight.get(key);
    if (pending) {
        return pending;
    }
    const promise = fetchSharikArtImage(artikul, size)
        .then((fetched) => {
        const fetchedAt = Date.now();
        const entry = {
            buffer: fetched.buffer,
            contentType: fetched.contentType,
            fetchedAt,
            etag: buildSharikArtImageEtag(size, artikul, fetched.buffer, fetchedAt),
        };
        if (cache.has(key)) {
            cache.delete(key);
        }
        else {
            evictOldestIfNeeded();
        }
        cache.set(key, entry);
        return entry;
    })
        .finally(() => {
        if (inflight.get(key) === promise) {
            inflight.delete(key);
        }
    });
    inflight.set(key, promise);
    return promise;
}
/** Сброс кеша для тестов. */
export function clearSharikArtImageCache() {
    cache.clear();
    inflight.clear();
}
/** Размер LRU (без inflight) — для тестов eviction. */
export function getSharikArtImageCacheSize() {
    return cache.size;
}
