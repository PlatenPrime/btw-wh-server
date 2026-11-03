export type SkugrSkuShareSortBy = "sales" | "revenue";

export function sortSkugrSkuSalesRows<T extends { salesPcs: number; salesUah: number }>(
  rows: readonly T[],
  sortBy?: SkugrSkuShareSortBy,
): T[] {
  const copy = [...rows];
  if (sortBy === "sales") {
    copy.sort((a, b) => b.salesPcs - a.salesPcs);
    return copy;
  }
  if (sortBy === "revenue") {
    copy.sort((a, b) => b.salesUah - a.salesUah);
  }
  return copy;
}
