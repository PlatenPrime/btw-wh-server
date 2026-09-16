import type { SkuSalesExcelSkuRow } from "./buildSkuSalesExcel.js";

export function sortSkuSalesExcelRowsByScore(
  rows: SkuSalesExcelSkuRow[],
  scoreOf: (row: SkuSalesExcelSkuRow) => number,
): SkuSalesExcelSkuRow[] {
  const scored = rows.map((row) => ({ row, score: scoreOf(row) }));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.row.productId.localeCompare(b.row.productId);
  });
  return scored.map((item) => item.row);
}
