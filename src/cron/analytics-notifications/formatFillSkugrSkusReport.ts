export type FillSkugrSkusReportStats = {
  successCount: number;
  errorCount: number;
  total: number;
};

export function formatFillSkugrSkusReport(
  stats: FillSkugrSkusReportStats
): string {
  return [
    "📊 Skugr refill — завершено",
    `Групи: ✅${stats.successCount} / ❌${stats.errorCount} / всього ${stats.total}`,
  ].join("\n");
}
