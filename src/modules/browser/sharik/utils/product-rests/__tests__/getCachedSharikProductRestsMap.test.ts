import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSharikProductRestsCache,
  getCachedSharikProductRestsMap,
} from "../getCachedSharikProductRestsMap.js";
import { SHARIK_PRODUCT_RESTS_CACHE_TTL_MS } from "../constants.js";
import type * as BrowserRequest from "../../../../utils/browserRequest.js";

vi.mock("../../../../utils/browserRequest.js", async (importOriginal) => {
  const actual = await importOriginal<typeof BrowserRequest>();
  return {
    ...actual,
    browserGet: vi.fn(),
    logBrowserError: vi.fn(),
  };
});

import { browserGet } from "../../../../utils/browserRequest.js";

describe("getCachedSharikProductRestsMap", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearSharikProductRestsCache();
    vi.mocked(browserGet).mockReset();
    vi.mocked(browserGet).mockResolvedValue(
      "<pre>1501-3445 = 7; 8; 509.60</pre>"
    );
  });

  afterEach(() => {
    clearSharikProductRestsCache();
    vi.useRealTimers();
  });

  it("fetches once and reuses cache within TTL", async () => {
    const first = await getCachedSharikProductRestsMap("1302-0065");
    const second = await getCachedSharikProductRestsMap("1302-0065");

    expect(browserGet).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(first.get("1501-3445")?.actualQuantity).toBe(7);
  });

  it("refetches after TTL expires", async () => {
    await getCachedSharikProductRestsMap("1302-0065");
    vi.advanceTimersByTime(SHARIK_PRODUCT_RESTS_CACHE_TTL_MS + 1);
    vi.mocked(browserGet).mockResolvedValue(
      "<pre>1501-3445 = 1; 2; 10.00</pre>"
    );

    const refreshed = await getCachedSharikProductRestsMap("1302-0065");

    expect(browserGet).toHaveBeenCalledTimes(2);
    expect(refreshed.get("1501-3445")).toEqual({
      actualQuantity: 1,
      sliceQuantity: 2,
      price: 10,
    });
  });

  it("dedupes parallel miss into one fetch", async () => {
    let resolveHtml!: (html: string) => void;
    vi.mocked(browserGet).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveHtml = resolve;
        })
    );

    const p1 = getCachedSharikProductRestsMap("1302-0065");
    const p2 = getCachedSharikProductRestsMap("1302-0065");

    resolveHtml("<pre>1501-3445 = 7; 8; 509.60</pre>");
    const [a, b] = await Promise.all([p1, p2]);

    expect(browserGet).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });
});
