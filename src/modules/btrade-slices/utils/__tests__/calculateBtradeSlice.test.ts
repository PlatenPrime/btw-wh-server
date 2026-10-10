import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateBtradeSlice } from "../calculateBtradeSlice.js";

vi.mock("../../../browser/sharik/utils/product-rests/index.js", () => ({
  getCachedSharikProductRestsMap: vi.fn(),
}));
vi.mock("../getUniqueArtikulsFromArtsUtil.js", () => ({
  getUniqueArtikulsFromArtsUtil: vi.fn(),
}));
vi.mock("../btradeSliceMonthStore.js", () => ({
  upsertDayPointsBulk: vi.fn(),
}));
vi.mock(
  "../../../sku-reporting/utils/materializeBtradeManufacturerSalesUtil.js",
  () => ({
    afterBtradeSliceStockMutation: vi.fn(),
  }),
);

import { getCachedSharikProductRestsMap } from "../../../browser/sharik/utils/product-rests/index.js";
import { afterBtradeSliceStockMutation } from "../../../sku-reporting/utils/materializeBtradeManufacturerSalesUtil.js";
import { getUniqueArtikulsFromArtsUtil } from "../getUniqueArtikulsFromArtsUtil.js";
import { upsertDayPointsBulk } from "../btradeSliceMonthStore.js";

describe("calculateBtradeSlice", () => {
  const mockSliceDate = new Date("2025-03-01T00:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockSliceDate);
    vi.mocked(getUniqueArtikulsFromArtsUtil).mockResolvedValue([
      "ART-1",
      "ART-2",
    ]);
    vi.mocked(getCachedSharikProductRestsMap).mockResolvedValue(
      new Map([
        ["ART-1", { actualQuantity: 3, sliceQuantity: 5, price: 100 }],
        ["ART-2", { actualQuantity: 8, sliceQuantity: 10, price: 200 }],
      ]),
    );
    vi.mocked(upsertDayPointsBulk).mockResolvedValue(2);
    vi.mocked(afterBtradeSliceStockMutation).mockResolvedValue({
      daysTouched: [],
      keysUpdated: 0,
      rollupDocs: 0,
      apply: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("saves sliceQuantity from product_rests via months bulk upsert", async () => {
    const result = await calculateBtradeSlice();

    expect(result).toEqual({
      saved: true,
      count: 2,
      totalArtikuls: 2,
      missing: 0,
      fromProductRests: 2,
    });
    expect(getCachedSharikProductRestsMap).toHaveBeenCalledTimes(1);
    expect(upsertDayPointsBulk).toHaveBeenCalledWith([
      {
        artikul: "ART-1",
        date: mockSliceDate,
        quantity: 5,
        price: 100,
      },
      {
        artikul: "ART-2",
        date: mockSliceDate,
        quantity: 10,
        price: 200,
      },
    ]);
    expect(afterBtradeSliceStockMutation).toHaveBeenCalledWith({
      dayD: mockSliceDate,
    });
  });

  it("writes -1/-1 sentinel when artikul missing on product_rests", async () => {
    vi.mocked(getCachedSharikProductRestsMap).mockResolvedValue(
      new Map([["ART-1", { actualQuantity: 3, sliceQuantity: 5, price: 100 }]]),
    );

    const result = await calculateBtradeSlice();

    expect(result).toEqual({
      saved: true,
      count: 1,
      totalArtikuls: 2,
      missing: 1,
      fromProductRests: 1,
    });
    expect(upsertDayPointsBulk).toHaveBeenCalledWith([
      {
        artikul: "ART-1",
        date: mockSliceDate,
        quantity: 5,
        price: 100,
      },
      {
        artikul: "ART-2",
        date: mockSliceDate,
        quantity: -1,
        price: -1,
      },
    ]);
  });

  it("when no artikuls only upserts empty list", async () => {
    vi.mocked(getUniqueArtikulsFromArtsUtil).mockResolvedValue([]);
    vi.mocked(getCachedSharikProductRestsMap).mockResolvedValue(new Map());

    const result = await calculateBtradeSlice();

    expect(result).toEqual({
      saved: true,
      count: 0,
      totalArtikuls: 0,
      missing: 0,
      fromProductRests: 0,
    });
    expect(upsertDayPointsBulk).toHaveBeenCalledWith([]);
  });
});
