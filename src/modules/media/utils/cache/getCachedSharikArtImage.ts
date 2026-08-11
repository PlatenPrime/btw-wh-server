import type { SharikArtImageSize } from "../build-sharik-art-image-url/buildSharikArtImageUrl.js";
import { fetchSharikArtImage } from "../fetch-sharik-art-image/fetchSharikArtImage.js";
import {
  SHARIK_ART_IMAGE_CACHE_MAX_ENTRIES,
  SHARIK_ART_IMAGE_CACHE_TTL_MS,
} from "./constants.js";

export type SharikArtImageCacheEntry = {
  buffer: Buffer;
  contentType: string;
  fetchedAt: number;
  etag: string;
};

type CacheKey = string;

const cache = new Map<CacheKey, SharikArtImageCacheEntry>();
const inflight = new Map<CacheKey, Promise<SharikArtImageCacheEntry>>();

export function buildSharikArtImageCacheKey(
  size: SharikArtImageSize,
  artikul: string
): CacheKey {
  return `${size}:${artikul}`;
}

export function buildSharikArtImageEtag(
  size: SharikArtImageSize,
  artikul: string,
  buffer: Buffer,
  fetchedAt: number
): string {
  return `"${size}-${artikul}-${buffer.length}-${fetchedAt}"`;
}

function isFresh(entry: SharikArtImageCacheEntry, now: number): boolean {
  return now - entry.fetchedAt < SHARIK_ART_IMAGE_CACHE_TTL_MS;
}

function touchLru(key: CacheKey, entry: SharikArtImageCacheEntry): void {
  cache.delete(key);
  cache.set(key, entry);
}

function evictOldestIfNeeded(): void {
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
export async function getCachedSharikArtImage(
  artikul: string,
  size: SharikArtImageSize
): Promise<SharikArtImageCacheEntry> {
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
      const entry: SharikArtImageCacheEntry = {
        buffer: fetched.buffer,
        contentType: fetched.contentType,
        fetchedAt,
        etag: buildSharikArtImageEtag(
          size,
          artikul,
          fetched.buffer,
          fetchedAt
        ),
      };
      if (cache.has(key)) {
        cache.delete(key);
      } else {
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
export function clearSharikArtImageCache(): void {
  cache.clear();
  inflight.clear();
}

/** Размер LRU (без inflight) — для тестов eviction. */
export function getSharikArtImageCacheSize(): number {
  return cache.size;
}
