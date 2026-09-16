import { describe, expect, it } from "vitest";
import type { SkuSalesExcelSkuRow } from "../buildSkuSalesExcel.js";
import { sortSkuSalesExcelRowsByScore } from "../sortSkuSalesExcelRowsByScore.js";

const row = (productId: string): SkuSalesExcelSkuRow => ({
  title: productId,
  url: "https://e.com",
  productId,
  konkName: "air",
  competitorTitle: "Air",
  producerName: "P",
});

describe("sortSkuSalesExcelRowsByScore", () => {
  it("scores each row once then sorts desc with productId tie-break", () => {
    const calls: string[] = [];
    const sorted = sortSkuSalesExcelRowsByScore(
      [row("aaa"), row("zzz"), row("mmm")],
      (item) => {
        calls.push(item.productId);
        if (item.productId === "aaa") return 10;
        if (item.productId === "zzz") return 10;
        return 1;
      },
    );
    expect(calls).toEqual(["aaa", "zzz", "mmm"]);
    expect(sorted.map((item) => item.productId)).toEqual(["aaa", "zzz", "mmm"]);
  });
});
