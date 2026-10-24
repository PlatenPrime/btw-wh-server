import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

vi.mock("../../../../../skus/models/Sku.js", () => ({
  Sku: { findById: vi.fn() },
}));
vi.mock("../../../../utils/correctManualBandSpikesForRangeUtil.js", () => ({
  correctManualBandSpikesForRangeUtil: vi.fn(),
}));

import { Sku } from "../../../../../skus/models/Sku.js";
import { correctManualBandSpikesForRangeUtil } from "../../../../utils/correctManualBandSpikesForRangeUtil.js";
import { correctBandSpikeUtil } from "../correctBandSpikeUtil.js";

const skuId = new mongoose.Types.ObjectId().toString();

describe("correctBandSpikeUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns SKU_NOT_FOUND", async () => {
    vi.mocked(Sku.findById).mockReturnValue({
      select: () => ({ lean: async () => null }),
    } as never);

    const result = await correctBandSpikeUtil({
      skuId,
      dateFrom: new Date("2026-09-14T00:00:00.000Z"),
      dateTo: new Date("2026-09-16T00:00:00.000Z"),
      stockMin: 9000,
      stockMax: 11000,
      apply: false,
    });

    expect(result).toEqual({
      ok: false,
      code: "SKU_NOT_FOUND",
      message: "Sku not found",
    });
    expect(correctManualBandSpikesForRangeUtil).not.toHaveBeenCalled();
  });

  it("returns NO_KONK_NAME", async () => {
    vi.mocked(Sku.findById).mockReturnValue({
      select: () => ({
        lean: async () => ({ konkName: "  ", productId: "p1" }),
      }),
    } as never);

    const result = await correctBandSpikeUtil({
      skuId,
      dateFrom: new Date("2026-09-14T00:00:00.000Z"),
      dateTo: new Date("2026-09-16T00:00:00.000Z"),
      stockMin: 9000,
      stockMax: 11000,
      apply: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("NO_KONK_NAME");
  });

  it("returns NO_PRODUCT_ID", async () => {
    vi.mocked(Sku.findById).mockReturnValue({
      select: () => ({
        lean: async () => ({ konkName: "svbum", productId: "" }),
      }),
    } as never);

    const result = await correctBandSpikeUtil({
      skuId,
      dateFrom: new Date("2026-09-14T00:00:00.000Z"),
      dateTo: new Date("2026-09-16T00:00:00.000Z"),
      stockMin: 900000,
      stockMax: 9999999,
      apply: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("NO_PRODUCT_ID");
  });

  it("previews patches for any konk with request band", async () => {
    vi.mocked(Sku.findById).mockReturnValue({
      select: () => ({
        lean: async () => ({ konkName: "svbum", productId: "sv-1" }),
      }),
    } as never);
    vi.mocked(correctManualBandSpikesForRangeUtil).mockResolvedValue({
      konkName: "svbum",
      apply: false,
      window: { dateFrom: "2026-09-14", dateTo: "2026-09-16" },
      band: { min: 900000, max: 9999999 },
      patched: [{ productId: "sv-1", date: "2026-09-15", from: 1_500_000, to: 80 }],
      skipped: [],
    });

    const result = await correctBandSpikeUtil({
      skuId,
      dateFrom: new Date("2026-09-14T00:00:00.000Z"),
      dateTo: new Date("2026-09-16T00:00:00.000Z"),
      stockMin: 900000,
      stockMax: 9999999,
      apply: false,
    });

    expect(correctManualBandSpikesForRangeUtil).toHaveBeenCalledWith({
      konkName: "svbum",
      stockMin: 900000,
      stockMax: 9999999,
      dateFrom: new Date("2026-09-14T00:00:00.000Z"),
      dateTo: new Date("2026-09-16T00:00:00.000Z"),
      apply: false,
      productIds: ["sv-1"],
    });
    expect(result).toEqual({
      ok: true,
      konkName: "svbum",
      productId: "sv-1",
      window: { dateFrom: "2026-09-14", dateTo: "2026-09-16" },
      band: { min: 900000, max: 9999999 },
      patches: [{ date: "2026-09-15", from: 1_500_000, to: 80 }],
      skipped: [],
      applied: false,
    });
  });

  it("sets applied true only when apply and patches exist", async () => {
    vi.mocked(Sku.findById).mockReturnValue({
      select: () => ({
        lean: async () => ({ konkName: "balun", productId: "b-1" }),
      }),
    } as never);
    vi.mocked(correctManualBandSpikesForRangeUtil).mockResolvedValue({
      konkName: "balun",
      apply: true,
      window: { dateFrom: "2026-09-14", dateTo: "2026-09-14" },
      band: { min: 9000, max: 11000 },
      patched: [{ productId: "b-1", date: "2026-09-14", from: 9937, to: 8 }],
      skipped: [],
    });

    const result = await correctBandSpikeUtil({
      skuId,
      dateFrom: new Date("2026-09-14T00:00:00.000Z"),
      dateTo: new Date("2026-09-14T00:00:00.000Z"),
      stockMin: 9000,
      stockMax: 11000,
      apply: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.applied).toBe(true);
  });
});
