export function formatFillSkugrSkusReport(stats) {
    return [
        "📊 Skugr refill — завершено",
        `Групи: ✅${stats.successCount} / ❌${stats.errorCount} / всього ${stats.total}`,
    ].join("\n");
}
