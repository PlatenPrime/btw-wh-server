export function formatGraboSkuSyncReport(stats) {
    return [
        "📊 Grabo SKU sync — завершено",
        `Категорії: ${stats.categoryCount}, listed: ${stats.listed}`,
        `Створено: ${stats.created}, оновлено: ${stats.updated}`,
        `Skip empty productId: ${stats.skippedNoProductId}, errors: ${stats.errors}`,
        `Off-site: ${stats.markedOffSite}, catalogComplete: ${stats.catalogComplete ? "yes" : "no"}`,
    ].join("\n");
}
