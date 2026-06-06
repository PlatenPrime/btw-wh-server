export function formatBtradeSliceReport(stats) {
    return [
        "📊 Btrade slice (Sharik) — завершено",
        `✅${stats.count} / ⚠️${stats.missing} з ${stats.totalArtikuls}`,
        `product_rests: ${stats.fromProductRests}, search: ${stats.fromSearch}`,
    ].join("\n");
}
