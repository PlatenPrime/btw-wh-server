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
  "../../../skus/controllers/get-sku-stock/utils/getSkuStockDataUtil.js",
  () => ({
    getSkuStockDataUtil: vi.fn(),
    UNSUPPORTED_KONK_CODE: "UNSUPPORTED_KONK",
  })
);
vi.mock("../../models/SkuSlice.js", () => ({
  SkuSlice: {
    findOneAndUpdate: vi.fn(),
  },
}));

import { Sku } from "../../../skus/models/Sku.js";
import { Skugr } from "../../../skugrs/models/Skugr.js";
import { getSkuStockDataUtil } from "../../../skus/controllers/get-sku-stock/utils/getSkuStockDataUtil.js";
import { SkuSlice } from "../../models/SkuSlice.js";

describe("runSkuSliceForKonkUtil", () => {
  const sliceDate = toSliceDate(new Date("2025-03-01T12:00:00.000Z"));

  beforeEach(() => {
    vi.mocked(SkuSlice.findOneAndUpdate).mockResolvedValue({} as any);
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

      expect(result).toEqual({ saved: true, count: 2 });

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

    expect(result.count).toBe(1);
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

    expect(result).toEqual({ saved: true, count: 0 });
    expect(getSkuStockDataUtil).not.toHaveBeenCalled();
    expect(SkuSlice.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(Sku.find).toHaveBeenCalledWith({
      konkName: "air",
      _id: { $in: [] },
    });
  });
});
