export function formatFillPosNameukrReport(stats) {
    return [
        "✅ Fill Pos nameukr — завершено",
        `Оновлено позицій: ${stats.updatedCount}`,
        `Пропущено артикулів без nameukr: ${stats.skippedArtikulsCount}`,
    ].join("\n");
}
export function formatFillPosNameukrErrorReport(error) {
    const msg = error instanceof Error ? error.message : String(error);
    return `❌ Fill Pos nameukr — помилка:\n${msg}`;
}
export function formatCronErrorReport(cronName, error) {
    const msg = error instanceof Error ? error.message : String(error);
    return `❌ ${cronName} — помилка:\n${msg}`;
}
