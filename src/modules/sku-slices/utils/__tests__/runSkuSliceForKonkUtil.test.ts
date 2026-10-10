import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toSliceDate } from "../../../../utils/sliceDate.js";
import { runSkuSliceForKonkUtil } from "../runSkuSliceForKonkUtil.js";

vi.mock("../../../skus/models/Sku.js", () => ({
  Sku: {
    find: vi.fn(),
  },
}));
vi.mock("../../../skugrs/models/Skugr.js", () => ({
  Skugr: {
    find: vi.fn(),
  },
}));
vi.mock("../../../skus/utils/getSkuStockDataUtil.js", () => ({
  getSkuStockDataUtil: vi.fn(),
  UNSUPPORTED_KONK_CODE: "UNSUPPORTED_KONK",
}));
vi.mock("../skuSliceMonthStore.js", () => ({
  loadDayPointsForProductIds: vi.fn(),
  upsertDayPoint: vi.fn(),
}));
vi.mock("../skuSliceDayMetaStore.js", () => ({
  ensureSkuSliceDayMeta: vi.fn(),
  upsertSkuSliceDayMeta: vi.fn(),
}));
vi.mock("../../../browser/utils/impitGet.js", () => ({
  resetImpitClientCache: vi.fn(),
}));
vi.mock("../../../../utils/delay.js", () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../../../utils/jitterMs.js", () => ({
  jitterMs: vi.fn((min: number) => min),
}));
vi.mock("../filterSlicedSkusForRotation.js", () => ({
  filterSlicedSkusForRotation: vi.fn(
    <T extends { _id: { toString(): string }; productId?: string }>(
      skus: T[],
    ) => ({
      skus,
      rotation: null,
    }),
  ),
}));

import { Sku } from "../../../skus/models/Sku.js";
import { Skugr } from "../../../skugrs/models/Skugr.js";
import { getSkuStockDataUtil } from "../../../skus/utils/getSkuStockDataUtil.js";
import { delay } from "../../../../utils/delay.js";
import { resetImpitClientCache } from "../../../browser/utils/impitGet.js";
import {
  filterSlicedSkusForRotation,
  type SlicedSkuWithProductId,
} from "../filterSlicedSkusForRotation.js";
import { type SliceRotationInfo } from "../../../slices/utils/sliceRotation.js";
import {
  AIR_SKU_SLICE_BLOCK_PAUSE_MIN_MS,
  AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MIN_MS,
} from "../../../sku-reporting/constants/skuSliceRequestJitterMs.js";
import {
  BrowserOriginBlockedError,
  ORIGIN_BLOCKED_CODE,
} from "../../../browser/utils/browserOriginBlockedError.js";
import {
  loadDayPointsForProductIds,
  upsertDayPoint,
} from "../skuSliceMonthStore.js";
import {
  ensureSkuSliceDayMeta,
  upsertSkuSliceDayMeta,
} from "../skuSliceDayMetaStore.js";

function mockAirSkus(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    _id: { toString: () => `id${i + 1}` },
    productId: `air-${i + 1}`,
  }));
}

function mockExistingPoints(data: Record<string, unknown> = {}) {
  vi.mocked(loadDayPointsForProductIds).mockResolvedValue(
    data as Record<string, { stock: number; price: number }>,
  );
}

function passThroughRotationMock<T extends SlicedSkuWithProductId>(
  skus: T[],
): { skus: T[]; rotation: SliceRotationInfo | null } {
  return { skus, rotation: null };
}

describe("runSkuSliceForKonkUtil", () => {
  const sliceDate = toSliceDate(new Date("2025-03-01T12:00:00.000Z"));

  beforeEach(() => {
    vi.mocked(filterSlicedSkusForRotation).mockImplementation(
      passThroughRotationMock,
    );
    vi.mocked(upsertDayPoint).mockResolvedValue(undefined);
    vi.mocked(ensureSkuSliceDayMeta).mockResolvedValue(undefined);
    vi.mocked(upsertSkuSliceDayMeta).mockResolvedValue({} as never);
    mockExistingPoints({});
    vi.mocked(Skugr.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            skus: [{ toString: () => "id1" }, { toString: () => "id2" }],
          },
        ]),
      }),
    } as any);
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: { toString: () => "id1" }, productId: "air-1" },
          { _id: { toString: () => "id2" }, productId: "air-2" },
        ]),
      }),
    } as any);
    vi.mocked(getSkuStockDataUtil)
      .mockResolvedValueOnce({ stock: 10, price: 100 })
      .mockResolvedValueOnce({ stock: 5, price: 200 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it(
    "upserts day meta then sets points per productId",
    async () => {
      vi.useFakeTimers();
      const resultPromise = runSkuSliceForKonkUtil(
        "air",
        new Date("2025-03-01T12:00:00.000Z"),
      );
      await vi.runAllTimersAsync();
      const result = await resultPromise;
      vi.useRealTimers();

      expect(result).toEqual({
        saved: true,
        count: 2,
        total: 2,
        invalid: 0,
        errors: 0,
      });

      expect(ensureSkuSliceDayMeta).toHaveBeenCalledWith("air", sliceDate);
      expect(upsertDayPoint).toHaveBeenCalledTimes(2);
      expect(Skugr.find).toHaveBeenCalledWith({
        konkName: "air",
        isSliced: true,
      });
      expect(Sku.find).toHaveBeenCalledWith({
        konkName: "air",
        _id: { $in: ["id1", "id2"] },
      });
      expect(upsertDayPoint).toHaveBeenNthCalledWith(
        1,
        "air",
        "air-1",
        sliceDate,
        { stock: 10, price: 100 },
      );
      expect(upsertDayPoint).toHaveBeenNthCalledWith(
        2,
        "air",
        "air-2",
        sliceDate,
        { stock: 5, price: 200 },
      );
      expect(upsertSkuSliceDayMeta).toHaveBeenCalledWith({
        konkName: "air",
        date: sliceDate,
        rotationMeta: null,
        stats: { filled: 2, invalid: 0, errorCount: 0 },
      });
    },
    10000,
  );

  it("skips skus without productId", async () => {
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: { toString: () => "id1" }, productId: "" },
          { _id: { toString: () => "id2" }, productId: "air-x" },
        ]),
      }),
    } as any);
    vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: 1, price: 2 });

    vi.useFakeTimers();
    const resultPromise = runSkuSliceForKonkUtil(
      "air",
      new Date("2025-03-01T12:00:00.000Z"),
    );
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    vi.useRealTimers();

    expect(result).toEqual({
      saved: true,
      count: 1,
      total: 2,
      invalid: 1,
      errors: 0,
    });
  });

  it("uses deduplicated sku ids from sliced groups", async () => {
    vi.mocked(Skugr.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            skus: [{ toString: () => "id1" }, { toString: () => "id2" }],
          },
          {
            skus: [{ toString: () => "id2" }, { toString: () => "id3" }],
          },
        ]),
      }),
    } as any);

    vi.useFakeTimers();
    const resultPromise = runSkuSliceForKonkUtil(
      "air",
      new Date("2025-03-01T12:00:00.000Z"),
    );
    await vi.runAllTimersAsync();
    await resultPromise;
    vi.useRealTimers();

    expect(Sku.find).toHaveBeenCalledWith({
      konkName: "air",
      _id: { $in: ["id1", "id2", "id3"] },
    });
  });

  it("does not process sku data when there are no sliced groups", async () => {
    vi.mocked(Skugr.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    } as any);
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await runSkuSliceForKonkUtil(
      "air",
      new Date("2025-03-01T12:00:00.000Z"),
    );

    expect(result).toEqual({
      saved: true,
      count: 0,
      total: 0,
      invalid: 0,
      errors: 0,
    });
    expect(getSkuStockDataUtil).not.toHaveBeenCalled();
    expect(ensureSkuSliceDayMeta).toHaveBeenCalledTimes(1);
    expect(upsertDayPoint).not.toHaveBeenCalled();
    expect(upsertSkuSliceDayMeta).toHaveBeenCalledTimes(1);
    expect(Sku.find).not.toHaveBeenCalled();
  });

  it("writes -1/-1 to day point but counts as invalid not success", async () => {
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: { toString: () => "id1" }, productId: "air-1" },
        ]),
      }),
    } as any);
    vi.mocked(getSkuStockDataUtil).mockReset();
    vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: -1, price: -1 });

    const result = await runSkuSliceForKonkUtil(
      "air",
      new Date("2025-03-01T12:00:00.000Z"),
    );

    expect(result).toEqual({
      saved: true,
      count: 0,
      total: 1,
      invalid: 1,
      errors: 0,
    });
    expect(upsertDayPoint).toHaveBeenCalledTimes(1);
    expect(upsertDayPoint).toHaveBeenCalledWith("air", "air-1", sliceDate, {
      stock: -1,
      price: -1,
    });
  });

  it("writes partial -1 price to day point but counts as invalid", async () => {
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: { toString: () => "id1" }, productId: "air-1" },
        ]),
      }),
    } as any);
    vi.mocked(getSkuStockDataUtil).mockReset();
    vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: 10, price: -1 });

    const result = await runSkuSliceForKonkUtil(
      "air",
      new Date("2025-03-01T12:00:00.000Z"),
    );

    expect(result).toEqual({
      saved: true,
      count: 0,
      total: 1,
      invalid: 1,
      errors: 0,
    });
  });

  it("aborts remaining SKUs on ORIGIN_BLOCKED without writing the blocked key", async () => {
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: { toString: () => "id1" }, productId: "air-1" },
          { _id: { toString: () => "id2" }, productId: "air-2" },
          { _id: { toString: () => "id3" }, productId: "air-3" },
        ]),
      }),
    } as any);
    vi.mocked(getSkuStockDataUtil).mockReset();
    vi.mocked(getSkuStockDataUtil)
      .mockResolvedValueOnce({ stock: 10, price: 1 })
      .mockRejectedValueOnce(
        new BrowserOriginBlockedError("cf 520", {
          httpStatus: 520,
          retryAfterSec: 60,
        }),
      );

    const result = await runSkuSliceForKonkUtil(
      "air",
      new Date("2025-03-01T12:00:00.000Z"),
    );

    expect(result).toEqual({
      saved: true,
      count: 1,
      total: 3,
      invalid: 0,
      errors: 2,
      abortReason: "origin_blocked",
    });
    expect(getSkuStockDataUtil).toHaveBeenCalledTimes(2);
    expect(upsertDayPoint).toHaveBeenCalledTimes(1);
    expect(upsertDayPoint).toHaveBeenCalledWith("air", "air-1", sliceDate, {
      stock: 10,
      price: 1,
    });
    expect(ORIGIN_BLOCKED_CODE).toBe("ORIGIN_BLOCKED");
  });

  it("adds air cluster pause after every 10 SKUs except last", async () => {
    const skus = Array.from({ length: 11 }, (_, i) => ({
      _id: { toString: () => `id${i + 1}` },
      productId: `air-${i + 1}`,
    }));
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(skus),
      }),
    } as any);
    vi.mocked(getSkuStockDataUtil).mockReset();
    vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: 1, price: 1 });
    vi.mocked(delay).mockClear();

    const result = await runSkuSliceForKonkUtil(
      "air",
      new Date("2025-03-01T12:00:00.000Z"),
    );

    expect(result.count).toBe(11);
    const delayMs = vi.mocked(delay).mock.calls.map((c) => c[0]);
    expect(delayMs.filter((ms) => ms === 2000)).toHaveLength(10);
    expect(delayMs.filter((ms) => ms === 20_000)).toHaveLength(1);
    expect(delayMs[9]).toBe(2000);
    expect(delayMs[10]).toBe(20_000);
  });

  it("adds air block pause after every 100 SKUs (not stacked with cluster)", async () => {
    const skus = mockAirSkus(101);
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(skus),
      }),
    } as any);
    vi.mocked(getSkuStockDataUtil).mockReset();
    vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: 1, price: 1 });
    vi.mocked(delay).mockClear();

    const result = await runSkuSliceForKonkUtil(
      "air",
      new Date("2025-03-01T12:00:00.000Z"),
    );

    expect(result.count).toBe(101);
    const delayMs = vi.mocked(delay).mock.calls.map((c) => c[0]);
    expect(
      delayMs.filter((ms) => ms === AIR_SKU_SLICE_BLOCK_PAUSE_MIN_MS),
    ).toHaveLength(1);
    const idxAfter100Jitter = delayMs.findIndex(
      (ms, i) => ms === AIR_SKU_SLICE_BLOCK_PAUSE_MIN_MS && i > 0,
    );
    expect(idxAfter100Jitter).toBeGreaterThan(0);
    expect(delayMs[idxAfter100Jitter - 1]).toBe(2000);
  });

  it("air: 2000 SKUs → two chunks, inter-chunk pause + resetImpit, no jitter on chunk boundary", async () => {
    const skus = mockAirSkus(2000);
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(skus),
      }),
    } as any);
    vi.mocked(getSkuStockDataUtil).mockReset();
    vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: 1, price: 1 });
    vi.mocked(delay).mockClear();
    vi.mocked(resetImpitClientCache).mockClear();

    const result = await runSkuSliceForKonkUtil(
      "air",
      new Date("2025-03-01T12:00:00.000Z"),
    );

    expect(result).toEqual({
      saved: true,
      count: 2000,
      total: 2000,
      invalid: 0,
      errors: 0,
    });
    expect(getSkuStockDataUtil).toHaveBeenCalledTimes(2000);
    expect(resetImpitClientCache).toHaveBeenCalledTimes(1);
    const interChunkPauses = vi
      .mocked(delay)
      .mock.calls.filter((c) => c[0] === AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MIN_MS);
    expect(interChunkPauses).toHaveLength(1);
  });

  it("air: valid keys in months skip fetch quota", async () => {
    const skus = mockAirSkus(1500);
    const prefilled: Record<string, { stock: number; price: number }> = {};
    for (let i = 1; i <= 500; i++) {
      prefilled[`air-${i}`] = { stock: 10, price: 100 };
    }
    mockExistingPoints(prefilled);
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(skus),
      }),
    } as any);
    vi.mocked(getSkuStockDataUtil).mockReset();
    vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: 1, price: 1 });

    const result = await runSkuSliceForKonkUtil(
      "air",
      new Date("2025-03-01T12:00:00.000Z"),
    );

    expect(result.count).toBe(1000);
    expect(result.errors).toBe(0);
    expect(getSkuStockDataUtil).toHaveBeenCalledTimes(1000);
  });

  it("air: proactive chunk stop at 1000 does not add errors", async () => {
    const skus = mockAirSkus(1100);
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(skus),
      }),
    } as any);
    vi.mocked(getSkuStockDataUtil).mockReset();
    vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: 1, price: 1 });

    const result = await runSkuSliceForKonkUtil(
      "air",
      new Date("2025-03-01T12:00:00.000Z"),
    );

    expect(result).toEqual({
      saved: true,
      count: 1100,
      total: 1100,
      invalid: 0,
      errors: 0,
    });
    expect(getSkuStockDataUtil).toHaveBeenCalledTimes(1100);
    expect(resetImpitClientCache).toHaveBeenCalledTimes(1);
  });

  it("air: aborts after 15 consecutive invalid", async () => {
    const skus = mockAirSkus(20);
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(skus),
      }),
    } as any);
    vi.mocked(getSkuStockDataUtil).mockReset();
    vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: -1, price: -1 });

    const result = await runSkuSliceForKonkUtil(
      "air",
      new Date("2025-03-01T12:00:00.000Z"),
    );

    expect(result).toEqual({
      saved: true,
      count: 0,
      total: 20,
      invalid: 15,
      errors: 5,
      abortReason: "consecutive_invalid",
    });
    expect(getSkuStockDataUtil).toHaveBeenCalledTimes(15);
  });

  it("air: 14 consecutive invalid then success does not abort", async () => {
    const skus = mockAirSkus(16);
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(skus),
      }),
    } as any);
    vi.mocked(getSkuStockDataUtil).mockReset();
    const mock = vi.mocked(getSkuStockDataUtil);
    for (let i = 0; i < 14; i++) {
      mock.mockResolvedValueOnce({ stock: -1, price: -1 });
    }
    mock.mockResolvedValue({ stock: 1, price: 1 });

    const result = await runSkuSliceForKonkUtil(
      "air",
      new Date("2025-03-01T12:00:00.000Z"),
    );

    expect(result.abortReason).toBeUndefined();
    expect(result.invalid).toBe(14);
    expect(result.count).toBe(2);
    expect(result.errors).toBe(0);
    expect(getSkuStockDataUtil).toHaveBeenCalledTimes(16);
  });

  it("air: processes full catalog without rotationMeta", async () => {
    const { filterSlicedSkusForRotation: actualFilter } = await vi.importActual<
      typeof import("../filterSlicedSkusForRotation.js")
    >("../filterSlicedSkusForRotation.js");
    vi.mocked(filterSlicedSkusForRotation).mockImplementation(actualFilter);
    const runDate = new Date("2026-06-10T12:00:00.000Z");
    const runSliceDate = toSliceDate(runDate);
    const allSkus = Array.from({ length: 9 }, (_, i) => ({
      _id: { toString: () => `id${i}` },
      productId: `air-${i}`,
    }));
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(allSkus),
      }),
    } as any);
    vi.mocked(getSkuStockDataUtil).mockReset();
    vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: 1, price: 1 });

    const result = await runSkuSliceForKonkUtil("air", runDate);

    expect(result.dueTotal).toBeUndefined();
    expect(result.rotationMeta).toBeUndefined();
    expect(result.count).toBe(9);
    expect(getSkuStockDataUtil).toHaveBeenCalledTimes(9);
    expect(upsertSkuSliceDayMeta).toHaveBeenCalledWith({
      konkName: "air",
      date: runSliceDate,
      rotationMeta: null,
      stats: { filled: 9, invalid: 0, errorCount: 0 },
    });
  });

  it("balun: no chunk loop or resetImpit", async () => {
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: { toString: () => "id1" }, productId: "balun-1" },
        ]),
      }),
    } as any);
    vi.mocked(getSkuStockDataUtil).mockReset();
    vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: 1, price: 1 });
    vi.mocked(resetImpitClientCache).mockClear();

    await runSkuSliceForKonkUtil("balun", new Date("2025-03-01T12:00:00.000Z"));

    expect(resetImpitClientCache).not.toHaveBeenCalled();
    expect(loadDayPointsForProductIds).not.toHaveBeenCalled();
  });
});
