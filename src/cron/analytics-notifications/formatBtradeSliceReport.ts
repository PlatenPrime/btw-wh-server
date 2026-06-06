export type BtradeSliceReportStats = {
  count: number;
  totalArtikuls: number;
  missing: number;
  fromProductRests: number;
  fromSearch: number;
};

export function formatBtradeSliceReport(stats: BtradeSliceReportStats): string {
  return [
    "📊 Btrade slice (Sharik) — завершено",
    `✅${stats.count} / ⚠️${stats.missing} з ${stats.totalArtikuls}`,
    `product_rests: ${stats.fromProductRests}, search: ${stats.fromSearch}`,
  ].join("\n");
}
