import { describe, expect, it } from "vitest";
import { sortSkugrSkuSalesRows } from "../sortSkugrSkuSalesRows.js";

const rows = [
  { id: "a", salesPcs: 1, salesUah: 30 },
  { id: "b", salesPcs: 5, salesUah: 10 },
  { id: "c", salesPcs: 5, salesUah: 40 },
];

describe("sortSkugrSkuSalesRows", () => {
  it("keeps the original order when sortBy is omitted", () => {
    const sorted = sortSkugrSkuSalesRows(rows);
    expect(sorted.map((row) => row.id)).toEqual(["a", "b", "c"]);
    expect(rows.map((row) => row.id)).toEqual(["a", "b", "c"]);
  });

  it("sorts by salesPcs desc and keeps ties stable", () => {
    const sorted = sortSkugrSkuSalesRows(rows, "sales");
    expect(sorted.map((row) => row.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by salesUah desc", () => {
    const sorted = sortSkugrSkuSalesRows(rows, "revenue");
    expect(sorted.map((row) => row.id)).toEqual(["c", "a", "b"]);
  });
});
