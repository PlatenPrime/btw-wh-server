import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SHARIK_ART_IMAGE_CACHE_MAX_ENTRIES,
  SHARIK_ART_IMAGE_CACHE_TTL_MS,
} from "../constants.js";
import {
  clearSharikArtImageCache,
  getCachedSharikArtImage,
  getSharikArtImageCacheSize,
} from "../getCachedSharikArtImage.js";

vi.mock("../../fetch-sharik-art-image/fetchSharikArtImage.js", () => ({
  fetchSharikArtImage: vi.fn(),
}));

import { fetchSharikArtImage } from "../../fetch-sharik-art-image/fetchSharikArtImage.js";

describe("getCachedSharikArtImage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearSharikArtImageCache();
    vi.mocked(fetchSharikArtImage).mockReset();
    vi.mocked(fetchSharikArtImage).mockResolvedValue({
      buffer: Buffer.from("jpeg-a"),
      contentType: "image/jpeg",
    });
  });

  afterEach(() => {
    clearSharikArtImageCache();
    vi.useRealTimers();
  });

  it("fetches once and reuses cache within TTL", async () => {
    const first = await getCachedSharikArtImage("1302-0065", "prev");
    const second = await getCachedSharikArtImage("1302-0065", "prev");

    expect(fetchSharikArtImage).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(first.contentType).toBe("image/jpeg");
    expect(first.etag).toMatch(/^"prev-1302-0065-6-\d+"$/);
  });

  it("refetches after TTL expires", async () => {
    await getCachedSharikArtImage("1302-0065", "prev");
    vi.advanceTimersByTime(SHARIK_ART_IMAGE_CACHE_TTL_MS + 1);
    vi.mocked(fetchSharikArtImage).mockResolvedValue({
      buffer: Buffer.from("jpeg-b"),
      contentType: "image/jpeg",
    });

    const refreshed = await getCachedSharikArtImage("1302-0065", "prev");

    expect(fetchSharikArtImage).toHaveBeenCalledTimes(2);
    expect(refreshed.buffer.toString()).toBe("jpeg-b");
  });

  it("dedupes parallel miss into one fetch", async () => {
    let resolveFetch!: (value: {
      buffer: Buffer;
      contentType: string;
    }) => void;
    vi.mocked(fetchSharikArtImage).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    const p1 = getCachedSharikArtImage("1302-0065", "big");
    const p2 = getCachedSharikArtImage("1302-0065", "big");

    resolveFetch({
      buffer: Buffer.from("parallel"),
      contentType: "image/jpeg",
    });
    const [a, b] = await Promise.all([p1, p2]);

    expect(fetchSharikArtImage).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it("evicts oldest LRU entry when max size exceeded", async () => {
    for (let i = 0; i < SHARIK_ART_IMAGE_CACHE_MAX_ENTRIES; i += 1) {
      vi.mocked(fetchSharikArtImage).mockResolvedValueOnce({
        buffer: Buffer.from(`img-${i}`),
        contentType: "image/jpeg",
      });
      await getCachedSharikArtImage(`art-${i}`, "prev");
    }

    expect(getSharikArtImageCacheSize()).toBe(
      SHARIK_ART_IMAGE_CACHE_MAX_ENTRIES
    );

    vi.mocked(fetchSharikArtImage).mockResolvedValueOnce({
      buffer: Buffer.from("new"),
      contentType: "image/jpeg",
    });
    await getCachedSharikArtImage("art-new", "prev");

    expect(getSharikArtImageCacheSize()).toBe(
      SHARIK_ART_IMAGE_CACHE_MAX_ENTRIES
    );

    vi.mocked(fetchSharikArtImage).mockClear();
    vi.mocked(fetchSharikArtImage).mockResolvedValue({
      buffer: Buffer.from("refetch-oldest"),
      contentType: "image/jpeg",
    });
    await getCachedSharikArtImage("art-0", "prev");
    expect(fetchSharikArtImage).toHaveBeenCalledTimes(1);
  });

  it("keeps separate keys for prev and big", async () => {
    await getCachedSharikArtImage("1302-0065", "prev");
    await getCachedSharikArtImage("1302-0065", "big");
    expect(fetchSharikArtImage).toHaveBeenCalledTimes(2);
    expect(getSharikArtImageCacheSize()).toBe(2);
  });
});
