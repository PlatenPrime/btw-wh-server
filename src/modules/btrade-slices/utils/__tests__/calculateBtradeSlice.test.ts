import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateBtradeSlice } from "../calculateBtradeSlice.js";

vi.mock("../../sharik/fetchSharikProductRestsMap.js", () => ({
  fetchSharikProductRestsMap: vi.fn(),
}));
vi.mock("../calculateBtradeSliceViaSearch.js", () => ({
  fetchMissingBtradeSliceItemsViaSearch: vi.fn(),
}));
vi.mock("../../models/BtradeSlice.js", () => ({
  BtradeSlice: {
    findOneAndUpdate: vi.fn(),
  },
}));
vi.mock("../getUniqueArtikulsFromArtsUtil.js", () => ({
  getUniqueArtikulsFromArtsUtil: vi.fn(),
}));

import { fetchSharikProductRestsMap } from "../../sharik/fetchSharikProductRestsMap.js";
import { fetchMissingBtradeSliceItemsViaSearch } from "../calculateBtradeSliceViaSearch.js";
import { BtradeSlice } from "../../models/BtradeSlice.js";
import { getUniqueArtikulsFromArtsUtil } from "../getUniqueArtikulsFromArtsUtil.js";

describe("calculateBtradeSlice", () => {
  const mockSliceDate = new Date("2025-03-01T00:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockSliceDate);
    vi.mocked(getUniqueArtikulsFromArtsUtil).mockResolvedValue([
      "ART-1",
      "ART-2",
    ]);
    vi.mocked(fetchSharikProductRestsMap).mockResolvedValue(
      new Map([
        ["ART-1", { quantity: 5, price: 100 }],
        ["ART-2", { quantity: 10, price: 200 }],
      ])
    );
    vi.mocked(fetchMissingBtradeSliceItemsViaSearch).mockResolvedValue({});
    vi.mocked(BtradeSlice.findOneAndUpdate).mockResolvedValue({} as never);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("saves all artikuls from product_rests in a single DB update", async () => {
    const result = await calculateBtradeSlice();

    expect(result).toEqual({ saved: true, count: 2 });
    expect(fetchSharikProductRestsMap).toHaveBeenCalledTimes(1);
    expect(fetchMissingBtradeSliceItemsViaSearch).not.toHaveBeenCalled();
    expect(BtradeSlice.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(BtradeSlice.findOneAndUpdate).toHaveBeenCalledWith(
      { date: mockSliceDate },
      {
        $set: {
          date: mockSliceDate,
          data: {
            "ART-1": { price: 100, quantity: 5 },
            "ART-2": { price: 200, quantity: 10 },
          },
        },
      },
      { upsert: true }
    );
  });

  it("uses search fallback for artikuls missing on product_rests page", async () => {
    vi.mocked(fetchSharikProductRestsMap).mockResolvedValue(
      new Map([["ART-1", { quantity: 5, price: 100 }]])
    );
    vi.mocked(fetchMissingBtradeSliceItemsViaSearch).mockResolvedValue({
      "ART-2": { price: 200, quantity: 10 },
    });

    const result = await calculateBtradeSlice();

    expect(result).toEqual({ saved: true, count: 2 });
    expect(fetchMissingBtradeSliceItemsViaSearch).toHaveBeenCalledWith([
      "ART-2",
    ]);
    expect(BtradeSlice.findOneAndUpdate).toHaveBeenCalledWith(
      { date: mockSliceDate },
      {
        $set: {
          date: mockSliceDate,
          data: {
            "ART-1": { price: 100, quantity: 5 },
            "ART-2": { price: 200, quantity: 10 },
          },
        },
      },
      { upsert: true }
    );
  });

  it("when no artikuls only upserts empty data", async () => {
    vi.mocked(getUniqueArtikulsFromArtsUtil).mockResolvedValue([]);
    vi.mocked(fetchSharikProductRestsMap).mockResolvedValue(new Map());

    const result = await calculateBtradeSlice();

    expect(result).toEqual({ saved: true, count: 0 });
    expect(fetchMissingBtradeSliceItemsViaSearch).not.toHaveBeenCalled();
    expect(BtradeSlice.findOneAndUpdate).toHaveBeenCalledWith(
      { date: mockSliceDate },
      { $set: { date: mockSliceDate, data: {} } },
      { upsert: true }
    );
  });
});
