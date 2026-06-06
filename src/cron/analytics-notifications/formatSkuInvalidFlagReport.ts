export type SkuInvalidFlagReportStats = {
  updated: number;
  konkCount: number;
};

export function formatSkuInvalidFlagReport(
  stats: SkuInvalidFlagReportStats
): string {
  return [
    "📊 Sku invalid flag sync — завершено",
    `Оновлено SKU: ${stats.updated}, конкурентів: ${stats.konkCount}`,
  ].join("\n");
}
