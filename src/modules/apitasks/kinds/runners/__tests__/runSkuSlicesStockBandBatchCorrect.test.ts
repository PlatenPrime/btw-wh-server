import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../events/utils/createEventUtil.js", () => ({
  createEventUtil: vi.fn(),
}));
vi.mock(
  "../../../../sku-slices/controllers/batch-correct-stock-band/utils/batchCorrectStockBandUtil.js",
  () => ({
    batchCorrectStockBandUtil: vi.fn(),
  }),
);

import { createEventUtil } from "../../../../events/utils/createEventUtil.js";
import { batchCorrectStockBandUtil } from "../../../../sku-slices/controllers/batch-correct-stock-band/utils/batchCorrectStockBandUtil.js";
import { runSkuSlicesStockBandBatchCorrect } from "../runTier1ApiTaskKinds.js";

describe("runSkuSlicesStockBandBatchCorrect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(batchCorrectStockBandUtil).mockResolvedValue({
      ok: true,
      bandId: "507f1f77bcf86cd799439011",
      result: {
        konkName: "balun",
        apply: true,
        window: { dateFrom: "2026-10-26", dateTo: "2026-11-08" },
        band: { min: 9500, max: 10500, normalMax: 500 },
        patched: [],
        skipped: [],
      },
    });
  });

  it("runs util and writes event", async () => {
    const onProgress = vi.fn();
    const result = await runSkuSlicesStockBandBatchCorrect(
      {
        bandId: "507f1f77bcf86cd799439011",
        dateFrom: "2026-10-26",
        dateTo: "2026-11-08",
        productIds: ["balun-1"],
      },
      { onProgress, userId: "u1" },
    );

    expect(result.ok).toBe(true);
    expect(batchCorrectStockBandUtil).toHaveBeenCalledWith(
      expect.objectContaining({
        bandId: "507f1f77bcf86cd799439011",
        productIds: ["balun-1"],
      }),
      expect.objectContaining({ onProgress }),
    );
    expect(createEventUtil).toHaveBeenCalledOnce();
  });

  it("fails on invalid params", async () => {
    const result = await runSkuSlicesStockBandBatchCorrect({ bandId: "bad" }, {});
    expect(result.ok).toBe(false);
  });

  it("fails when band missing", async () => {
    vi.mocked(batchCorrectStockBandUtil).mockResolvedValue({
      ok: false,
      code: "BAND_NOT_FOUND",
      message: "Sku stock band not found",
    });
    const result = await runSkuSlicesStockBandBatchCorrect(
      {
        bandId: "507f1f77bcf86cd799439011",
        dateFrom: "2026-10-26",
        dateTo: "2026-11-08",
        productIds: ["balun-1"],
      },
      {},
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Sku stock band not found");
    }
  });
});
