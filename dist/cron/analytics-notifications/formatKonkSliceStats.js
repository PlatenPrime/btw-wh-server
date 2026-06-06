export function formatKonkSliceLine(stats) {
    return `${stats.konkName}: ✅${stats.count} / ❌${stats.errors} / ⚠️${stats.invalid}`;
}
export function formatKonkSliceReportLines(competitors) {
    return competitors.map(formatKonkSliceLine);
}
