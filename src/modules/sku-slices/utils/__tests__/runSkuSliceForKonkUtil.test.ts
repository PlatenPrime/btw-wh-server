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
vi.mock(
  "../../../skus/utils/getSkuStockDataUtil.js",
  () => ({
    getSkuStockDataUtil: vi.fn(),
    UNSUPPORTED_KONK_CODE: "UNSUPPORTED_KONK",
  })
);
vi.mock("../../models/SkuSlice.js", () => ({
  SkuSlice: {
    findOneAndUpdate: vi.fn(),
    findOne: vi.fn(),
  },
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

import { Sku } from "../../../skus/models/Sku.js";
import { Skugr } from "../../../skugrs/models/Skugr.js";
import { getSkuStockDataUtil } from "../../../skus/utils/getSkuStockDataUtil.js";
import { SkuSlice } from "../../models/SkuSlice.js";
import { delay } from "../../../../utils/delay.js";
import { resetImpitClientCache } from "../../../browser/utils/impitGet.js";
import { AIR_SKU_SLICE_BLOCK_PAUSE_MIN_MS, AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MIN_MS } from "../../../sku-reporting/constants/skuSliceRequestJitterMs.js";
import {
  BrowserOriginBlockedError,
  ORIGIN_BLOCKED_CODE,
} from "../../../browser/utils/browserOriginBlockedError.js";

function mockAirSkus(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    _id: { toString: () => `id${i + 1}` },
    productId: `air-${i + 1}`,
  }));
}

function mockSliceFindOne(data: Record<string, unknown> = {}) {
  vi.mocked(SkuSlice.findOne).mockReturnValue({
    select: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue({ data }),
    }),
  } as any);
}

describe("runSkuSliceForKonkUtil", () => {
  const sliceDate = toSliceDate(new Date("2025-03-01T12:00:00.000Z"));

  beforeEach(() => {
    vi.mocked(SkuSlice.findOneAndUpdate).mockResolvedValue({} as any);
    mockSliceFindOne({});
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
    "upserts slice then sets data per productId",
    async () => {
      vi.useFakeTimers();
      const resultPromise = runSkuSliceForKonkUtil(
        "air",
        new Date("2025-03-01T12:00:00.000Z")
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

      expect(SkuSlice.findOneAndUpdate).toHaveBeenCalledTimes(3);
      expect(Skugr.find).toHaveBeenCalledWith({ konkName: "air", isSliced: true });
      expect(Sku.find).toHaveBeenCalledWith({
        konkName: "air",
        _id: { $in: ["id1", "id2"] },
      });
      const calls = vi.mocked(SkuSlice.findOneAndUpdate).mock.calls;

      expect(calls[0]![0]).toEqual({ konkName: "air", date: sliceDate });
      expect(calls[0]![1]).toEqual({
        $setOnInsert: { konkName: "air", date: sliceDate, data: {} },
      });

      expect(calls[1]![1]).toEqual({
        $set: { "data.air-1": { stock: 10, price: 100 } },
      });
      expect(calls[2]![1]).toEqual({
        $set: { "data.air-2": { stock: 5, price: 200 } },
      });
    },
    10000
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
      new Date("2025-03-01T12:00:00.000Z")
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
      new Date("2025-03-01T12:00:00.000Z")
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
      new Date("2025-03-01T12:00:00.000Z")
    );

    expect(result).toEqual({
      saved: true,
      count: 0,
      total: 0,
      invalid: 0,
      errors: 0,
    });
    expect(getSkuStockDataUtil).not.toHaveBeenCalled();
    expect(SkuSlice.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(Sku.find).not.toHaveBeenCalled();
  });

  it("writes -1/-1 to data but counts as invalid not success", async () => {
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
      new Date("2025-03-01T12:00:00.000Z")
    );

    expect(result).toEqual({
      saved: true,
      count: 0,
      total: 1,
      invalid: 1,
      errors: 0,
    });
    expect(SkuSlice.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(SkuSlice.findOneAndUpdate).toHaveBeenNthCalledWith(
      2,
      { konkName: "air", date: sliceDate },
      { $set: { "data.air-1": { stock: -1, price: -1 } } }
    );
  });

  it("writes partial -1 price to data but counts as invalid", async () => {
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
      new Date("2025-03-01T12:00:00.000Z")
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
        })
      );

    const result = await runSkuSliceForKonkUtil(
      "air",
      new Date("2025-03-01T12:00:00.000Z")
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
    const dataSets = vi
      .mocked(SkuSlice.findOneAndUpdate)
      .mock.calls.filter((c) => "$set" in (c[1] as object));
    expect(dataSets).toHaveLength(1);
    expect(dataSets[0]![1]).toEqual({
      $set: { "data.air-1": { stock: 10, price: 1 } },
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
      new Date("2025-03-01T12:00:00.000Z")
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
      new Date("2025-03-01T12:00:00.000Z")
    );

    expect(result.count).toBe(101);
    const delayMs = vi.mocked(delay).mock.calls.map((c) => c[0]);
    expect(delayMs.filter((ms) => ms === AIR_SKU_SLICE_BLOCK_PAUSE_MIN_MS)).toHaveLength(
      1
    );
    // На 100 — только block, без cluster 20s в тот же момент
    const idxAfter100Jitter = delayMs.findIndex(
      (ms, i) => ms === AIR_SKU_SLICE_BLOCK_PAUSE_MIN_MS && i > 0
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
      new Date("2025-03-01T12:00:00.000Z")
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

  it("air: valid keys in data skip fetch quota", async () => {
    const skus = mockAirSkus(1500);
    const prefilled: Record<string, { stock: number; price: number }> = {};
    for (let i = 1; i <= 500; i++) {
      prefilled[`air-${i}`] = { stock: 10, price: 100 };
    }
    mockSliceFindOne(prefilled);
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(skus),
      }),
    } as any);
    vi.mocked(getSkuStockDataUtil).mockReset();
    vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: 1, price: 1 });

    const result = await runSkuSliceForKonkUtil(
      "air",
      new Date("2025-03-01T12:00:00.000Z")
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
      new Date("2025-03-01T12:00:00.000Z")
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
      new Date("2025-03-01T12:00:00.000Z")
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
      new Date("2025-03-01T12:00:00.000Z")
    );

    expect(result.abortReason).toBeUndefined();
    expect(result.invalid).toBe(14);
    expect(result.count).toBe(2);
    expect(result.errors).toBe(0);
    expect(getSkuStockDataUtil).toHaveBeenCalledTimes(16);
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
    expect(SkuSlice.findOne).not.toHaveBeenCalled();
  });
});
