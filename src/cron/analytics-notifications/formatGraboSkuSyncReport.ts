export type GraboSkuSyncReportStats = {
  categoryCount: number;
  listed: number;
  created: number;
  updated: number;
  skippedNoProductId: number;
  errors: number;
  markedOffSite: number;
  catalogComplete: boolean;
};

export function formatGraboSkuSyncReport(stats: GraboSkuSyncReportStats): string {
  return [
    "📊 Grabo SKU sync — завершено",
    `Категорії: ${stats.categoryCount}, listed: ${stats.listed}`,
    `Створено: ${stats.created}, оновлено: ${stats.updated}`,
    `Skip empty productId: ${stats.skippedNoProductId}, errors: ${stats.errors}`,
    `Off-site: ${stats.markedOffSite}, catalogComplete: ${stats.catalogComplete ? "yes" : "no"}`,
  ].join("\n");
}
