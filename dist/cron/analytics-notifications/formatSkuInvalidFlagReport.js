export function formatSkuInvalidFlagReport(stats) {
    return [
        "📊 Sku invalid flag sync — завершено",
        `Оновлено SKU: ${stats.updated}, конкурентів: ${stats.konkCount}`,
    ].join("\n");
}
