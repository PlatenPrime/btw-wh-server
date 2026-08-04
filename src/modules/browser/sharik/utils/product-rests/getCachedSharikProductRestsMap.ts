import {
  getProductRestsSeedArtikul,
  SHARIK_PRODUCT_RESTS_CACHE_TTL_MS,
} from "./constants.js";
import { fetchSharikProductRestsMap } from "./fetchSharikProductRestsMap.js";
import type { SharikProductRestsItem } from "./types.js";

type CacheEntry = {
  map: Map<string, SharikProductRestsItem>;
  fetchedAt: number;
  seedArtikul: string;
  inflight: Promise<Map<string, SharikProductRestsItem>> | null;
};

let cache: CacheEntry | null = null;

function isCacheFresh(entry: CacheEntry, seedArtikul: string, now: number): boolean {
  return (
    entry.seedArtikul === seedArtikul &&
    now - entry.fetchedAt < SHARIK_PRODUCT_RESTS_CACHE_TTL_MS
  );
}

/**
 * Возвращает карту product_rests с in-memory TTL ~1ч.
 * Параллельные miss'ы делят один inflight-fetch.
 */
export async function getCachedSharikProductRestsMap(
  seedArtikul: string = getProductRestsSeedArtikul()
): Promise<Map<string, SharikProductRestsItem>> {
  const now = Date.now();

  if (cache && isCacheFresh(cache, seedArtikul, now)) {
    return cache.map;
  }

  if (cache && cache.seedArtikul === seedArtikul && cache.inflight) {
    return cache.inflight;
  }

  const inflight = fetchSharikProductRestsMap(seedArtikul).then((map) => {
    cache = {
      map,
      fetchedAt: Date.now(),
      seedArtikul,
      inflight: null,
    };
    return map;
  });

  cache = {
    map: cache?.seedArtikul === seedArtikul ? cache.map : new Map(),
    fetchedAt: cache?.seedArtikul === seedArtikul ? cache.fetchedAt : 0,
    seedArtikul,
    inflight,
  };

  try {
    return await inflight;
  } catch (error) {
    if (cache?.inflight === inflight) {
      cache.inflight = null;
    }
    throw error;
  }
}

/** Сброс кэша (тесты). */
export function clearSharikProductRestsCache(): void {
  cache = null;
}
