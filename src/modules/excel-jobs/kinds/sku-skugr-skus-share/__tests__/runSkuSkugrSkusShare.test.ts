import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { runExcelJobKind } from "../../runExcelJobKind.js";

describe("runSkuSkugrSkusShare", () => {
  beforeEach(async () => {
    await Skugr.deleteMany({});
  });

  it("fails validation before touching mongo", async () => {
    const result = await runExcelJobKind("sku-skugr-skus-share", {});
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("Validation error");
  });

  it("fails when the skugr does not exist", async () => {
    const result = await runExcelJobKind("sku-skugr-skus-share", {
      skugrId: "507f1f77bcf86cd799439011",
      dateFrom: "2026-10-26",
      dateTo: "2026-11-03",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("Skugr not found");
  });

  it("builds an empty share workbook and reports 0/1 when the group has no skus", async () => {
    const skugr = await Skugr.create({
      konkName: "share-job-k",
      prodName: "share-job-p",
      title: "Empty share",
      url: "https://example.com/g",
      isSliced: true,
      skus: [],
    });
    const progress: Array<[number, number]> = [];
    const result = await runExcelJobKind(
      "sku-skugr-skus-share",
      {
        skugrId: skugr._id.toString(),
        dateFrom: "2026-10-26",
        dateTo: "2026-11-03",
        sortBy: "revenue",
      },
      {
        onProgress: (done, total) => progress.push([done, total]),
      },
    );
    expect(progress).toEqual([[0, 1]]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fileName).toBe(
      `sku_skugr_skus_share_${skugr._id.toString()}_2026-10-26_2026-11-03.xlsx`,
    );
    expect(result.buffer.subarray(0, 2).toString("utf8")).toBe("PK");
  });
});
