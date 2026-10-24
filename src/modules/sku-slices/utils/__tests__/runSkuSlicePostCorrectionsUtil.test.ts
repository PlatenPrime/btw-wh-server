import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiTaskAbortedError } from "../../../apitasks/kinds/apiTaskRunTypes.js";
import { packFlipAutoApplyKonks } from "../../../slices/config/packFlipAutoApplyKonks.js";

vi.mock("../reviewPackFlipsUtil.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../reviewPackFlipsUtil.js")>();
  return {
    ...actual,
    reviewPackFlipsUtil: vi.fn(),
  };
});
vi.mock("../../../sku-reporting/utils/materializeSkuSliceSalesUtil.js", () => ({
  afterSkuSliceStockMutation: vi.fn(),
}));

import { reviewPackFlipsUtil } from "../reviewPackFlipsUtil.js";
import { afterSkuSliceStockMutation } from "../../../sku-reporting/utils/materializeSkuSliceSalesUtil.js";
import { runSkuSlicePostCorrectionsUtil } from "../runSkuSlicePostCorrectionsUtil.js";

const emptyPackFlip = {
  konkName: "perfect",
  apply: false,
  dates: [],
  patched: [],
  priceOnly: [],
  ambiguous: [],
};

describe("runSkuSlicePostCorrectionsUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reviewPackFlipsUtil).mockResolvedValue(emptyPackFlip);
    vi.mocked(afterSkuSliceStockMutation).mockResolvedValue({
      konkName: "air",
      keysUpdated: 0,
      rollupDocs: 0,
      daysTouched: [],
      apply: true,
    });
  });

  it("runs pack-flip then rollup for each day when konkName omitted", async () => {
    const result = await runSkuSlicePostCorrectionsUtil({
      dateFrom: new Date("2026-04-02T00:00:00.000Z"),
      dateTo: new Date("2026-04-03T00:00:00.000Z"),
      apply: false,
      rollupKonkNames: ["air"],
    });

    expect(result.days).toHaveLength(2);
    expect(reviewPackFlipsUtil).toHaveBeenCalledTimes(2 * packFlipAutoApplyKonks.length);
    expect(afterSkuSliceStockMutation).toHaveBeenCalledTimes(2);
    expect(result.errors).toEqual([]);
    expect(result.days[0]).not.toHaveProperty("balun");
    expect(result.days[0]).not.toHaveProperty("svbum");
  });

  it("when konkName=balun only rollups balun (no pack-flip)", async () => {
    const result = await runSkuSlicePostCorrectionsUtil({
      dateFrom: new Date("2026-04-02T00:00:00.000Z"),
      dateTo: new Date("2026-04-03T00:00:00.000Z"),
      apply: true,
      konkName: "balun",
      rollupKonkNames: ["air", "balun", "svbum"],
    });

    expect(result.konkName).toBe("balun");
    expect(reviewPackFlipsUtil).not.toHaveBeenCalled();
    expect(afterSkuSliceStockMutation).toHaveBeenCalledTimes(2);
    expect(afterSkuSliceStockMutation).toHaveBeenCalledWith(
      expect.objectContaining({ konkName: "balun" }),
    );
  });

  it("when konkName=svbum only rollups svbum", async () => {
    await runSkuSlicePostCorrectionsUtil({
      dateFrom: new Date("2026-04-03T00:00:00.000Z"),
      dateTo: new Date("2026-04-03T00:00:00.000Z"),
      apply: false,
      konkName: "svbum",
    });

    expect(reviewPackFlipsUtil).not.toHaveBeenCalled();
    expect(afterSkuSliceStockMutation).toHaveBeenCalledWith(
      expect.objectContaining({ konkName: "svbum" }),
    );
  });

  it("when konkName is pack-flip auto-apply konk runs pack-flip for that konk", async () => {
    const packKonk = packFlipAutoApplyKonks[0]!;
    await runSkuSlicePostCorrectionsUtil({
      dateFrom: new Date("2026-04-03T00:00:00.000Z"),
      dateTo: new Date("2026-04-03T00:00:00.000Z"),
      apply: false,
      konkName: packKonk,
    });

    expect(reviewPackFlipsUtil).toHaveBeenCalledOnce();
    expect(reviewPackFlipsUtil).toHaveBeenCalledWith(
      expect.objectContaining({ konkName: packKonk }),
    );
    expect(afterSkuSliceStockMutation).toHaveBeenCalledWith(
      expect.objectContaining({ konkName: packKonk }),
    );
  });

  it("continues when pack-flip throws and records error", async () => {
    vi.mocked(reviewPackFlipsUtil).mockRejectedValue(new Error("pack down"));
    const onPackFlipError = vi.fn();

    const result = await runSkuSlicePostCorrectionsUtil({
      dateFrom: new Date("2026-04-03T00:00:00.000Z"),
      dateTo: new Date("2026-04-03T00:00:00.000Z"),
      apply: true,
      rollupKonkNames: [],
      hooks: { onPackFlipError },
    });

    expect(onPackFlipError).toHaveBeenCalledOnce();
    expect(result.errors).toEqual([
      {
        step: "pack-flip",
        asOf: "2026-04-03",
        konkName: packFlipAutoApplyKonks[0],
        message: "pack down",
      },
    ]);
  });

  it("respects abort signal between days", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      runSkuSlicePostCorrectionsUtil({
        dateFrom: new Date("2026-04-02T00:00:00.000Z"),
        dateTo: new Date("2026-04-03T00:00:00.000Z"),
        apply: false,
        rollupKonkNames: [],
        signal: controller.signal,
      }),
    ).rejects.toBeInstanceOf(ApiTaskAbortedError);

    expect(reviewPackFlipsUtil).not.toHaveBeenCalled();
  });

  it("reports progress per day", async () => {
    const onProgress = vi.fn();
    await runSkuSlicePostCorrectionsUtil({
      dateFrom: new Date("2026-04-03T00:00:00.000Z"),
      dateTo: new Date("2026-04-03T00:00:00.000Z"),
      apply: false,
      rollupKonkNames: [],
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledWith(0, 1, expect.stringContaining("2026-04-03"));
    expect(onProgress).toHaveBeenCalledWith(1, 1, "Post-corrections completed");
  });
});
