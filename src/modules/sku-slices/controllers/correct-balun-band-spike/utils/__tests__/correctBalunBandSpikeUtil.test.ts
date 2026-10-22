import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../utils/correctBalunManualBandSpikesForRangeUtil.js", () => ({
  correctBalunManualBandSpikesForRangeUtil: vi.fn(),
}));

vi.mock("../../../../../skus/models/Sku.js", () => ({
  Sku: { findById: vi.fn() },
}));

import { Sku } from "../../../../../skus/models/Sku.js";
import { correctBalunManualBandSpikesForRangeUtil } from "../../../../utils/correctBalunManualBandSpikesForRangeUtil.js";
import { correctBalunBandSpikeUtil } from "../correctBalunBandSpikeUtil.js";

describe("correctBalunBandSpikeUtil", () => {
  const skuId = "507f1f77bcf86cd799439011";
  const dateFrom = new Date("2026-09-14T00:00:00.000Z");
  const dateTo = new Date("2026-09-15T00:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns NOT_BALUN for non-balun sku", async () => {
    vi.mocked(Sku.findById).mockReturnValue({
      select: () => ({
        lean: async () => ({ konkName: "air", productId: "air-1" }),
      }),
    } as never);

    const result = await correctBalunBandSpikeUtil({
      skuId,
      dateFrom,
      dateTo,
      apply: false,
    });

    expect(result).toEqual({
      ok: false,
      code: "NOT_BALUN",
      message: "Sku competitor is not balun",
    });
    expect(correctBalunManualBandSpikesForRangeUtil).not.toHaveBeenCalled();
  });

  it("returns SKU_NOT_FOUND for missing id", async () => {
    vi.mocked(Sku.findById).mockReturnValue({
      select: () => ({
        lean: async () => null,
      }),
    } as never);

    const result = await correctBalunBandSpikeUtil({
      skuId,
      dateFrom,
      dateTo,
      apply: false,
    });

    expect(result).toEqual({
      ok: false,
      code: "SKU_NOT_FOUND",
      message: "Sku not found",
    });
  });

  it("returns NO_PRODUCT_ID when productId empty", async () => {
    vi.mocked(Sku.findById).mockReturnValue({
      select: () => ({
        lean: async () => ({ konkName: "balun", productId: "  " }),
      }),
    } as never);

    const result = await correctBalunBandSpikeUtil({
      skuId,
      dateFrom,
      dateTo,
      apply: false,
    });

    expect(result).toEqual({
      ok: false,
      code: "NO_PRODUCT_ID",
      message: "Sku has no productId",
    });
  });

  it("maps range util preview to per-sku response", async () => {
    vi.mocked(Sku.findById).mockReturnValue({
      select: () => ({
        lean: async () => ({ konkName: "balun", productId: "balun-1" }),
      }),
    } as never);
    vi.mocked(correctBalunManualBandSpikesForRangeUtil).mockResolvedValue({
      konkName: "balun",
      apply: false,
      window: { dateFrom: "2026-09-14", dateTo: "2026-09-15" },
      band: { min: 9000, max: 10000 },
      patched: [
        { productId: "balun-1", date: "2026-09-14", from: 9937, to: 59 },
        { productId: "balun-1", date: "2026-09-15", from: 9937, to: 59 },
      ],
      skipped: [],
    });

    const result = await correctBalunBandSpikeUtil({
      skuId,
      dateFrom,
      dateTo,
      apply: false,
    });

    expect(correctBalunManualBandSpikesForRangeUtil).toHaveBeenCalledWith({
      dateFrom,
      dateTo,
      apply: false,
      productIds: ["balun-1"],
    });
    expect(result).toEqual({
      ok: true,
      productId: "balun-1",
      window: { dateFrom: "2026-09-14", dateTo: "2026-09-15" },
      band: { min: 9000, max: 10000 },
      patches: [
        { date: "2026-09-14", from: 9937, to: 59 },
        { date: "2026-09-15", from: 9937, to: 59 },
      ],
      skipped: [],
      applied: false,
    });
  });

  it("sets applied true when apply and patches exist", async () => {
    vi.mocked(Sku.findById).mockReturnValue({
      select: () => ({
        lean: async () => ({ konkName: "Balun", productId: "balun-1" }),
      }),
    } as never);
    vi.mocked(correctBalunManualBandSpikesForRangeUtil).mockResolvedValue({
      konkName: "balun",
      apply: true,
      window: { dateFrom: "2026-09-14", dateTo: "2026-09-15" },
      band: { min: 9000, max: 10000 },
      patched: [
        { productId: "balun-1", date: "2026-09-14", from: 9937, to: 70 },
        { productId: "balun-1", date: "2026-09-15", from: 9927, to: 60 },
      ],
      skipped: [],
    });

    const result = await correctBalunBandSpikeUtil({
      skuId,
      dateFrom,
      dateTo,
      apply: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.applied).toBe(true);
    expect(result.patches.map((p) => p.to)).toEqual([70, 60]);
  });

  it("forwards skipped reasons from range util", async () => {
    vi.mocked(Sku.findById).mockReturnValue({
      select: () => ({
        lean: async () => ({ konkName: "balun", productId: "balun-1" }),
      }),
    } as never);
    vi.mocked(correctBalunManualBandSpikesForRangeUtil).mockResolvedValue({
      konkName: "balun",
      apply: false,
      window: { dateFrom: "2026-09-14", dateTo: "2026-09-15" },
      band: { min: 9000, max: 10000 },
      patched: [],
      skipped: [
        {
          productId: "balun-1",
          dateFrom: "2026-09-14",
          dateTo: "2026-09-15",
          reason: "missing-right",
        },
      ],
    });

    const result = await correctBalunBandSpikeUtil({
      skuId,
      dateFrom,
      dateTo,
      apply: false,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.patches).toEqual([]);
    expect(result.skipped[0]?.reason).toBe("missing-right");
  });
});
